<?php
// public/api/list_accounts.php
require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT id, organizationId, name FROM accounts");
    $accounts = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'accounts' => $accounts
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
