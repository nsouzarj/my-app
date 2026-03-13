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
    
    $stmt = $pdo->prepare("UPDATE accounts SET name = ?, type = ?, balance = ?, updatedAt = NOW() WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['type'],
        $data['balance'],
        $id
    ]);
    
    echo json_encode(['success' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM accounts WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>
