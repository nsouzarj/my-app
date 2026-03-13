<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll();
    echo json_encode(['columns' => $columns]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
