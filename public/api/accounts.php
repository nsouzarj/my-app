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
                           VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    
    $stmt->execute([
        $id,
        $data['name'],
        $data['type'],
        $data['balance'],
        $data['organizationId']
    ]);

    // Se o saldo inicial for > 0, cria uma transação automática de "Saldo Inicial"
    $initialBalance = (float)$data['balance'];
    if ($initialBalance > 0) {
        $txId = bin2hex(random_bytes(16));
        $stmtTx = $pdo->prepare("INSERT INTO transactions (id, amount, description, date, type, accountId, organizationId, status, createdAt, updatedAt) 
                                 VALUES (?, ?, ?, NOW(), 'income', ?, ?, 'paid', NOW(), NOW())");
        $stmtTx->execute([
            $txId,
            $initialBalance,
            "Saldo Inicial: " . $data['name'],
            $id,
            $data['organizationId']
        ]);
    }
    
    echo json_encode(['success' => true, 'id' => $id]);
}

if ($method === 'PUT') {
    $data = getJsonInput();
    $id = $_GET['id'];
    
    // 1. Buscar saldo atual para ver se houve alteração manual
    $stmtOld = $pdo->prepare("SELECT balance, organizationId FROM accounts WHERE id = ?");
    $stmtOld->execute([$id]);
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
    
    $stmt = $pdo->prepare("UPDATE accounts SET name = ?, type = ?, updatedAt = NOW() WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['type'],
        $id
    ]);

    // 3. Recalcular saldo baseado no histórico consolidado
    recalculateAccountBalance($pdo, $id);
    
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM accounts WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>
