<?php
// public/api/reconcile_all.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$organizationId = $_GET['organizationId'] ?? null;

if (!$organizationId) {
    if ($method === 'POST') {
        $data = getJsonInput();
        $organizationId = $data['organizationId'] ?? null;
    }
}

if (!$organizationId) {
    die(json_encode(['error' => 'organizationId is required']));
}

try {
    // 1. Buscar todas as contas da organização
    $stmt = $pdo->prepare("SELECT id FROM accounts WHERE organizationId = ?");
    $stmt->execute([$organizationId]);
    $accounts = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($accounts)) {
        die(json_encode(['success' => true, 'message' => 'Nenhuma conta encontrada para esta organização.']));
    }

    // 2. Recalcular saldo de cada conta
    foreach ($accounts as $accountId) {
        recalculateAccountBalance($pdo, $accountId);
    }

    echo json_encode([
        'success' => true, 
        'message' => count($accounts) . ' conta(s) sincronizada(s) com sucesso!'
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
