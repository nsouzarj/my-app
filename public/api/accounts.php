<?php
// public/api/accounts.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? 'default_org';

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM accounts WHERE organizationId = ? ORDER BY name ASC");
    $stmt->execute([$organizationId]);
    $accounts = $stmt->fetchAll();
    
    foreach ($accounts as &$acc) {
        $acc['balance'] = (float)$acc['balance'];
    }
    
    echo json_encode($accounts);
}

if ($method === 'POST') {
    $data = getJsonInput();
    $id = bin2hex(random_bytes(16));
    
    $stmt = $pdo->prepare("INSERT INTO accounts (id, name, type, balance, organizationId, createdAt, updatedAt) 
                           VALUES (:id, :name, :type, :balance, :organizationId, NOW(), NOW())");
    
    $stmt->execute([
        ':id' => $id,
        ':name' => $data['name'],
        ':type' => $data['type'],
        ':balance' => $data['balance'],
        ':organizationId' => $data['organizationId']
    ]);

    // Se o saldo inicial for > 0, cria uma transação automática de "Saldo Inicial"
    $initialBalance = (float)$data['balance'];
    if ($initialBalance > 0) {
        $txId = bin2hex(random_bytes(16));
        // Usar a mesma ordem e estrutura de transactions.php para consistência
        $stmtTx = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, categoryId, organizationId, due_date, payment_date, status, is_fixed, createdAt, updatedAt) 
                                 VALUES (:id, :amount, :description, NOW(), 'income', :accountId, :categoryId, :organizationId, NULL, NULL, 'paid', 0, NOW(), NOW())");
        $stmtTx->execute([
            ':id' => $txId,
            ':amount' => $initialBalance,
            ':description' => "Saldo Inicial: " . $data['name'],
            ':accountId' => $id,
            ':categoryId' => '16272b2fbb47d1feb74e94cfeed9032a',
            ':organizationId' => $data['organizationId']
        ]);
    }
    
    echo json_encode(['success' => true, 'id' => $id]);
}

if ($method === 'PUT') {
    $data = getJsonInput();
    $id = $_GET['id'];
    
    // 1. Buscar saldo atual para ver se houve alteração manual
    $stmtOld = $pdo->prepare("SELECT balance, organizationId FROM accounts WHERE id = :id");
    $stmtOld->execute([':id' => $id]);
    $oldAccount = $stmtOld->fetch();
    $oldBalance = (float)($oldAccount['balance'] ?? 0);
    $orgId = $oldAccount['organizationId'] ?? 'default_org';

    $newBalance = (float)$data['balance'];

    // 2. Se o saldo mudou, criar transação de ajuste (Reconciliação)
    if (abs($newBalance - $oldBalance) > 0.001) {
        $diff = $newBalance - $oldBalance;
        $type = ($diff > 0) ? 'income' : 'expense';
        $absAmount = abs($diff);
        
        $txId = bin2hex(random_bytes(16));
        // Usamos uma categoria genérica "Outras" ou similar para o ajuste
        $stmtTx = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, organizationId, categoryId, status, createdAt, updatedAt) 
                                 VALUES (?, ?, ?, NOW(), ?, ?, ?, '16272b2fbb47d1feb74e94cfeed9032a', 'paid', NOW(), NOW())");
        $stmtTx->execute([
            $txId,
            $absAmount,
            "Ajuste de Saldo (Manual)",
            $type,
            $id,
            $orgId
        ]);
    }
    
    $stmt = $pdo->prepare("UPDATE accounts SET name = :name, type = :type, updatedAt = NOW() WHERE id = :id");
    $stmt->execute([
        ':name' => $data['name'],
        ':type' => $data['type'],
        ':id' => $id
    ]);

    // 3. Recalcular saldo baseado no histórico consolidado
    recalculateAccountBalance($pdo, $id);
    
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM accounts WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(['success' => true]);
}
?>
