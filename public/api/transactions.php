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
    $allowedSortFields = ['date', 'amount', 'description', 'type', 'categoryName', 'accountName'];
    $sortBy = in_array($sortByInput, $allowedSortFields) ? $sortByInput : 'date';
    $order = ($orderInput === 'ASC') ? 'ASC' : 'DESC';

    // Se o campo de ordenação for de outra tabela, ajustamos o prefixo
    $orderBy = "t.{$sortBy}";
    if ($sortBy === 'accountName') $orderBy = "a.name";
    if ($sortBy === 'categoryName') $orderBy = "c.name";
    
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
    
    // Inserir transação
    $stmt = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, categoryId, organizationId, due_date, payment_date, status, is_fixed, createdAt, updatedAt) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    
    $stmt->execute([
        $id,
        $amountInput,
        $data['description'],
        $data['date'],
        strtolower($data['type']), // Garante 'income' ou 'expense' sempre minúsculo
        $data['accountId'],
        $data['categoryId'],
        $data['organizationId'],
        $data['due_date'] ?? null,
        $data['payment_date'] ?? null,
        $data['status'] ?? 'paid',
        $data['is_fixed'] ?? 0
    ]);

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
        categoryId = ?, 
        accountId = ?,
        due_date = ?,
        payment_date = ?,
        status = ?,
        is_fixed = ?,
        updatedAt = NOW() 
        WHERE id = ?");
        
    $stmt->execute([
        $amountInput,
        $data['description'],
        $data['date'],
        $data['categoryId'],
        $data['accountId'],
        $data['due_date'] ?? null,
        $data['payment_date'] ?? null,
        $data['status'] ?? 'paid',
        $data['is_fixed'] ?? 0,
        $id
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

    // 1. Buscar conta antes de deletar
    $stmtOld = $pdo->prepare("SELECT accountId FROM transactions WHERE id = ?");
    $stmtOld->execute([$id]);
    $accountId = $stmtOld->fetchColumn();

    // 2. Deletar transação
    $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
    $stmt->execute([$id]);

    // 3. Recalcular saldo da conta impactada
    if ($accountId) {
        recalculateAccountBalance($pdo, $accountId);
    }

    echo json_encode(['success' => true]);
}
?>
