<?php
// tmp_accounts_debug.php (Modified for debugging)
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? 'default_org';

if ($method === 'POST') {
    $data = getJsonInput();
    $id = bin2hex(random_bytes(16));
    
    echo "DEBUG: id=$id, orgId=" . ($data['organizationId'] ?? 'NULL') . "\n";
    
    $stmt = $pdo->prepare("INSERT INTO accounts (id, name, type, balance, organizationId, createdAt, updatedAt) 
                           VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    
    $stmt->execute([
        $id,
        $data['name'],
        $data['type'],
        $data['balance'],
        $data['organizationId']
    ]);

    $initialBalance = (float)$data['balance'];
    if ($initialBalance > 0) {
        $txId = bin2hex(random_bytes(16));
        echo "DEBUG AUTO-TX: txId=$txId, accountId=$id\n";
        $sql = "INSERT INTO transactions (id, amount, description, date, type, accountId, organizationId, categoryId, status, createdAt, updatedAt) 
                                 VALUES (?, ?, ?, NOW(), 'income', ?, ?, '16272b2fbb47d1feb74e94cfeed9032a', 'paid', NOW(), NOW())";
        $stmtTx = $pdo->prepare($sql);
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
?>
