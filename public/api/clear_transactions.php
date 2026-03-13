<?php
// public/api/clear_transactions.php
require_once 'db.php';

$organizationId = '3c2ecd8cc00085cf291369725a342f5d'; // Sua organização atual

try {
    $stmt = $pdo->prepare("DELETE FROM transactions WHERE organizationId = ?");
    $stmt->execute([$organizationId]);
    $count = $stmt->rowCount();

    echo json_encode([
        'status' => 'success',
        'message' => "Limpeza concluída. $count transações foram removidas.",
        'organization_id' => $organizationId
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
