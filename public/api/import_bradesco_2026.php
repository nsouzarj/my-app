<?php
// my-app/public/api/import_bradesco_2026.php
require_once 'db.php';
require_once 'transactions.php'; // Para usar recalculateAccountBalance

$csvFile = 'D:/Dowloads/PlanejamentoPAg2026.csv';

if (!file_exists($csvFile)) {
    die(json_encode(['error' => 'Arquivo não encontrado em: ' . $csvFile]));
}

$organizationId = '3c2ecd8cc00085cf291369725a342f5d'; 
$bradescoAccountId = '2925d608b053cc5f31ea90e34ec3c30f';
$despesasFixasCatId = 'd43209ac-1d03-4d30-a04a-0b64400e82c1';

try {
    // 1. Limpar importações anteriores para evitar duplicatas (Opcional, mas recomendado pelo "lance de novo")
    // Como o usuário disse "lance de novo", vamos limpar as despesas DESTA conta primeiro.
    $stmt = $pdo->prepare("DELETE FROM transactions WHERE organizationId = ? AND accountId = ? AND type = 'expense'");
    $stmt->execute([$organizationId, $bradescoAccountId]);

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
        $date = trim($date);
        $parts = explode('/', $date);
        if (count($parts) === 3) {
            return sprintf('%04d-%02d-%02d', $parts[2], $parts[1], $parts[0]);
        }
        return null;
    }

    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        $rowCount++;
        processBlock($data, 0, $pdo, $organizationId, $bradescoAccountId, $despesasFixasCatId, $importedCount);
        if (isset($data[6])) {
            processBlock($data, 6, $pdo, $organizationId, $bradescoAccountId, $despesasFixasCatId, $importedCount);
        }
    }

    fclose($handle);

    // Recalcular saldo do Bradesco ao final
    recalculateAccountBalance($pdo, $bradescoAccountId);

    echo json_encode([
        'status' => 'success',
        'message' => "Importação concluída. $importedCount transações inseridas no Bradesco.",
        'details' => ['read' => $rowCount, 'imported' => $importedCount]
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

function processBlock($row, $startIdx, $pdo, $orgId, $accId, $catId, &$count) {
    $desc = trim($row[$startIdx] ?? '');
    if (empty($desc) || in_array($desc, ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Total', 'Valor', 'Pago', 'Data venc', 'DatData Pag'])) {
        return;
    }

    $val = cleanMoney($row[$startIdx + 1] ?? '0');
    if ($val <= 0) return;

    $isPaidText = trim($row[$startIdx + 2] ?? '');
    $isPaid = ($isPaidText === 'Sim' || $isPaidText === 'SIM');
    $dueDate = formatDate($row[$startIdx + 3] ?? '');
    $paymentDate = formatDate($row[$startIdx + 4] ?? '');

    // Se estiver pago, a data oficial é a de pagamento. Se não, a de vencimento.
    $finalDate = ($isPaid && $paymentDate) ? $paymentDate : $dueDate;
    if (!$finalDate) $finalDate = date('Y-m-d');

    $sql = "INSERT INTO transactions 
            (id, accountId, organizationId, categoryId, description, amount, type, status, due_date, payment_date, date, is_fixed, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, 'expense', ?, ?, ?, ?, 1, NOW(), NOW())";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        uniqid(),
        $accId,
        $orgId,
        $catId,
        $desc,
        $val,
        $isPaid ? 'paid' : 'pending',
        $dueDate,
        $paymentDate,
        $finalDate
    ]);

    $count++;
}
