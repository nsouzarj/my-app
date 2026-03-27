<?php
require_once 'db.php';

try {
    $sql = "ALTER TABLE transactions ADD COLUMN last_notified_at DATETIME NULL;";
    $pdo->exec($sql);
    echo json_encode(['success' => true, 'message' => 'Coluna last_notified_at adicionada com sucesso.']);
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode(['success' => true, 'message' => 'Coluna last_notified_at já existia.']);
    } else {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
