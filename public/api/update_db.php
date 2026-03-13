<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER email");
    echo json_encode(['success' => true, 'message' => 'Tabela users atualizada com sucesso.']);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
