<?php
// public/api/import_csv_2026.php
require_once 'db.php';

$csvFile = 'D:/Dowloads/PlanejamentoPAg2026.csv';

if (!file_exists($csvFile)) {
    die(json_encode(['error' => 'Arquivo não encontrado em: ' . $csvFile]));
}

$organizationId = '3c2ecd8cc00085cf291369725a342f5d'; 
$defaultAccountId = null; 

try {
    // Buscar primeira conta da organização
    $stmt = $pdo->prepare("SELECT id FROM accounts WHERE organizationId = ? LIMIT 1");
    $stmt->execute([$organizationId]);
    $defaultAccountId = $stmt->fetchColumn();

    if (!$defaultAccountId) {
        die(json_encode(['error' => 'Nenhuma conta encontrada para esta organização. Crie uma conta no app primeiro.']));
    }

    // Garantir que existe uma categoria de fallback
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE (name = 'Outros' OR name = 'Geral') AND organizationId = ? LIMIT 1");
    $stmt->execute([$organizationId]);
    $fallbackCatId = $stmt->fetchColumn();

    if (!$fallbackCatId) {
        $fallbackCatId = uniqid();
        $stmt = $pdo->prepare("INSERT INTO categories (id, organizationId, name, type, color, icon, createdAt, updatedAt) VALUES (?, ?, 'Outros', 'expense', '#a8a29e', 'Tag', NOW(), NOW())");
        $stmt->execute([$fallbackCatId, $organizationId]);
    }

    // Mapeamento manual de Categorias
    $categoryMap = [
        'Aluguel' => 'Habitação',
        'Moradia' => 'Habitação',
        'Agua' => 'Contas Residenciais',
        'Luz' => 'Contas Residenciais',
        'Celular' => 'Comunicação',
        'Internet' => 'Comunicação',
        'Condo' => 'Habitação',
        'Itau' => 'Cartão de Crédito',
        'Animal' => 'Pets',
        'Cachorro' => 'Pets'
    ];

    // Tentar mapear categorias existentes
    $catIds = [];
    foreach ($categoryMap as $key => $targetName) {
        $stmt = $pdo->prepare("SELECT id FROM categories WHERE name LIKE ? AND organizationId = ? LIMIT 1");
        $stmt->execute(['%' . $targetName . '%', $organizationId]);
        $id = $stmt->fetchColumn();
        if ($id) $catIds[$key] = $id;
    }

    $handle = fopen($csvFile, 'r');
    $rowCount = 0;
    $importedCount = 0;

    function cleanMoney($val) {
        $val = str_replace(['R$', '.', ' '], '', $val);
        $val = str_replace(',', '.', $val);
        return (float) $val;
    }

    function formatDate($date) {
        if (!$date || empty($date)) return null;
        $parts = explode('/', $date);
        if (count($parts) === 3) {
            return sprintf('%04d-%02d-%02d', $parts[2], $parts[1], $parts[0]);
        }
        return null;
    }

    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        $rowCount++;
        processBlock($data, 0, $pdo, $organizationId, $defaultAccountId, $catIds, $fallbackCatId, $importedCount);
        if (isset($data[6])) {
            processBlock($data, 6, $pdo, $organizationId, $defaultAccountId, $catIds, $fallbackCatId, $importedCount);
        }
    }

    fclose($handle);

    echo json_encode([
        'status' => 'success',
        'message' => "Importação concluída. $importedCount transações inseridas.",
        'details' => ['read' => $rowCount, 'imported' => $importedCount]
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

function processBlock($row, $startIdx, $pdo, $orgId, $accId, $catIds, $fallbackCatId, &$count) {
    $desc = trim($row[$startIdx] ?? '');
    if (empty($desc) || in_array($desc, ['Janeiro', 'Fevereiro', 'Marco', 'Total', 'Valor', 'Pago', 'Data venc', 'DatData Pag'])) {
        return;
    }

    $val = cleanMoney($row[$startIdx + 1] ?? '0');
    if ($val <= 0) return;

    $isPaid = (trim($row[$startIdx + 2] ?? '') === 'Sim');
    $dueDate = formatDate($row[$startIdx + 3] ?? '');
    $paymentDate = formatDate($row[$startIdx + 4] ?? '');

    $finalCatId = $fallbackCatId;
    foreach($catIds as $key => $cid) {
        if (stripos($desc, $key) !== false) {
            $finalCatId = $cid;
            break;
        }
    }

    $sql = "INSERT INTO transactions 
            (id, accountId, organizationId, categoryId, description, amount, type, status, due_date, payment_date, date, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, 'expense', ?, ?, ?, ?, NOW(), NOW())";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        uniqid(),
        $accId,
        $orgId,
        $finalCatId,
        $desc,
        $val,
        $isPaid ? 'paid' : 'pending',
        $dueDate,
        $paymentDate,
        $dueDate ?? date('Y-m-d H:i:s')
    ]);

    $count++;
}
