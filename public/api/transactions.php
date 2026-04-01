<?php
// public/api/transactions.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? 'default_org'; // Fallback if no auth context yet

/**
 * Recalcula o saldo de uma conta do zero com base no histórico de transações.
 * Esta abordagem "bulletproof" elimina erros de arredondamento ou inconsistências acumuladas.
 */
if ($method === 'GET') {
    $accountId = $_GET['accountId'] ?? null;
    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
    $type = $_GET['type'] ?? 'all';
    $sortByInput = $_GET['sortBy'] ?? 'date';
    $orderInput = strtoupper($_GET['order'] ?? 'DESC');

    // Validação de segurança para ordenação (Whitelist)
    $allowedSortFields = ['date', 'amount', 'description', 'type', 'categoryName', 'accountName', 'createdAt'];
    $sortBy = in_array($sortByInput, $allowedSortFields) ? $sortByInput : 'date';
    $order = ($orderInput === 'ASC') ? 'ASC' : 'DESC';

    // Construção do ORDER BY
    // Se ordenar por data, adicionamos createdAt como critério de desempate
    // O {$order} final no final do SQL cuidará do critério principal e deste secundário
    if ($sortBy === 'date') {
        $orderBy = "t.date {$order}, t.createdAt";
    } elseif ($sortBy === 'accountName') {
        $orderBy = "a.name";
    } elseif ($sortBy === 'categoryName') {
        $orderBy = "c.name";
    } else {
        $orderBy = "t.{$sortBy}";
    }
    
    $sql = "SELECT t.*, a.name as accountName, c.name as categoryName 
            FROM transactions t
            LEFT JOIN accounts a ON t.accountId = a.id
            LEFT JOIN categories c ON t.categoryId = c.id
            WHERE t.organizationId = ?";

    
    $params = [$organizationId];
    
    if ($accountId) {
        $sql .= " AND t.accountId = ?";
        $params[] = $accountId;
    }

    if ($startDate) {
        $sql .= " AND t.date >= ?";
        $params[] = $startDate;
    }

    if ($endDate) {
        $sql .= " AND t.date <= ?";
        $params[] = $endDate;
    }

    if ($type !== 'all') {
        $sql .= " AND t.type = ?";
        $params[] = $type;
    }

    $statusFilter = $_GET['statusFilter'] ?? 'all';
    $allowedStatuses = ['paid', 'pending', 'planned'];
    if ($statusFilter !== 'all') {
        // Suporte a múltiplos status separados por vírgula (ex: "paid,pending")
        $requestedStatuses = array_filter(
            array_map('trim', explode(',', $statusFilter)),
            fn($s) => in_array($s, $allowedStatuses)
        );
        if (!empty($requestedStatuses)) {
            $placeholders = implode(',', array_fill(0, count($requestedStatuses), '?'));
            $sql .= " AND t.status IN ($placeholders)";
            foreach ($requestedStatuses as $s) {
                $params[] = $s;
            }
        }
    } else {
        // Por padrão (all), não mostramos as planejadas para manter o extrato limpo
        $sql .= " AND (t.status = 'paid' OR t.status = 'pending')";
    }

    $categoryIdFilter = $_GET['categoryId'] ?? null;
    if ($categoryIdFilter && $categoryIdFilter !== 'all') {
        $sql .= " AND t.categoryId = ?";
        $params[] = $categoryIdFilter;
    }
    
    $sql .= " ORDER BY {$orderBy} {$order}";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();
    foreach ($transactions as &$t) {
        $t['amount'] = (float)$t['amount'];
    }
    echo json_encode($transactions);
}

if ($method === 'POST') {
    $data = getJsonInput();
    $id = bin2hex(random_bytes(16));
    
    // Converter valor com segurança para float (lida com vírgulas se houver)
    // Usamos abs() para garantir que o valor salvo seja positivo, o 'type' decide o impacto
    $amountInput = abs((float)str_replace(',', '.', $data['amount']));
    
    $totalInstallments = isset($data['totalInstallments']) ? (int)$data['totalInstallments'] : 1;
    
    if ($totalInstallments > 1) {
        $parentTransactionId = $id;
        $installmentAmount = round($amountInput / $totalInstallments, 2);
        
        $stmt = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, categoryId, organizationId, due_date, payment_date, status, is_fixed, reminderDays, parentTransactionId, installmentNumber, totalInstallments, createdAt, updatedAt) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                               
        $baseDate = isset($data['firstInstallmentDate']) ? $data['firstInstallmentDate'] : $data['date'];
        
        // Determinar se é cartão de crédito para cálculo inteligente
        $stmtAcc = $pdo->prepare("SELECT type, closingDay, dueDay FROM accounts WHERE id = ?");
        $stmtAcc->execute([$data['accountId']]);
        $account = $stmtAcc->fetch();
        $isCreditCard = ($account && strtoupper($account['type']) === 'CREDIT_CARD' && $account['closingDay'] && $account['dueDay']);
        
        for ($i = 1; $i <= $totalInstallments; $i++) {
            $childId = ($i === 1) ? $id : bin2hex(random_bytes(16)); // keeps main ID for response but generates others
            
            if ($isCreditCard) {
                $purchaseDate = new DateTime($data['date']); // Compra original
                $day = (int)$purchaseDate->format('j');
                $billMonth = (int)$purchaseDate->format('n');
                $billYear = (int)$purchaseDate->format('Y');
                
                // Se passou do dia de fechamento, cai na fatura do mês seguinte
                if ($day > (int)$account['closingDay']) {
                    $billMonth++;
                }
                
                // Avança meses correspondentes à parcela atual
                $currentMonth = $billMonth + ($i - 1);
                $currentYear = $billYear + (int)floor(($currentMonth - 1) / 12);
                $currentMonth = (($currentMonth - 1) % 12) + 1;
                
                $installmentDate = sprintf('%04d-%02d-%02d', $currentYear, $currentMonth, (int)$account['dueDay']);
            } else {
                // Instalações normais
                $dateObj = new DateTime($baseDate);
                $dateObj->modify('+' . ($i - 1) . ' month');
                $installmentDate = $dateObj->format('Y-m-d');
            }
            
            $stmt->execute([
                $childId,
                $installmentAmount,
                $data['description'] . " (" . $i . "/" . $totalInstallments . ")",
                $installmentDate,
                strtolower($data['type']),
                $data['accountId'],
                $data['categoryId'],
                $data['organizationId'],
                $data['due_date'] ?? null,
                $data['payment_date'] ?? null,
                $data['status'] ?? 'paid',
                $data['is_fixed'] ?? 0,
                $parentTransactionId,
                $i,
                $totalInstallments,
                $data['reminderDays'] ?? null
            ]);
        }
    } else {
        $stmt = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, categoryId, organizationId, due_date, payment_date, status, is_fixed, reminderDays, createdAt, updatedAt) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        
        $stmt->execute([
            $id,
            $amountInput,
            $data['description'],
            $data['date'],
            strtolower($data['type']),
            $data['accountId'],
            $data['categoryId'],
            $data['organizationId'],
            $data['due_date'] ?? null,
            $data['payment_date'] ?? null,
            $data['status'] ?? 'paid',
            $data['is_fixed'] ?? 0,
            $data['reminderDays'] ?? null
        ]);
    }

    // Recalcular Saldo da Conta (Sempre do zero para evitar drift)
    if (!empty($data['accountId'])) {
        recalculateAccountBalance($pdo, $data['accountId']);
    }
    
    echo json_encode(['success' => true, 'id' => $id]);
}

if ($method === 'PUT') {
    $data = getJsonInput();
    $id = $_GET['id'];

    // 1. Buscar transação antiga para saber qual conta recalcular depois
    $stmtOld = $pdo->prepare("SELECT accountId FROM transactions WHERE id = ?");
    $stmtOld->execute([$id]);
    $oldAccountId = $stmtOld->fetchColumn();
    
    // 2. Atualizar transação
    $amountInput = abs((float)str_replace(',', '.', $data['amount']));

    $stmt = $pdo->prepare("UPDATE transactions SET 
        amount = ?, 
        description = ?, 
        date = ?, 
        type = ?,
        categoryId = ?, 
        accountId = ?,
        due_date = ?,
        payment_date = ?,
        status = ?,
        is_fixed = ?,
        reminderDays = ?,
        updatedAt = NOW() 
        WHERE id = ? AND organizationId = ?");
        
    $stmt->execute([
        $amountInput,
        $data['description'],
        $data['date'],
        strtolower($data['type']),
        $data['categoryId'],
        $data['accountId'],
        $data['due_date'] ?? null,
        $data['payment_date'] ?? null,
        $data['status'] ?? 'paid',
        $data['is_fixed'] ?? 0,
        $data['reminderDays'] ?? null,
        $id,
        $data['organizationId']
    ]);

    // 3. Recalcular saldos
    // Recalcula a conta nova (atualizada)
    if (!empty($data['accountId'])) {
        recalculateAccountBalance($pdo, $data['accountId']);
    }
    // Se a conta mudou, recalcula a antiga também
    if ($oldAccountId && $oldAccountId !== $data['accountId']) {
        recalculateAccountBalance($pdo, $oldAccountId);
    }
    
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];

    // 1. Buscar conta antes de deletar (Garantindo organização)
    $stmtOld = $pdo->prepare("SELECT accountId FROM transactions WHERE id = ? AND organizationId = ?");
    $stmtOld->execute([$id, $organizationId]);
    $accountId = $stmtOld->fetchColumn();

    if (!$accountId) {
        echo json_encode(['error' => 'Transação não encontrada ou acesso negado']);
        exit;
    }

    // 2. Deletar transação
    $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND organizationId = ?");
    $stmt->execute([$id, $organizationId]);

    // 3. Recalcular saldo da conta impactada
    if ($accountId) {
        recalculateAccountBalance($pdo, $accountId);
    }

    echo json_encode(['success' => true]);
}
?>
