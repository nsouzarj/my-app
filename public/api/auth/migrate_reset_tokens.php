<?php
// public/api/auth/migrate_reset_tokens.php
require_once __DIR__ . '/../db.php';

try {
    $sql = "ALTER TABLE users 
            ADD COLUMN reset_token VARCHAR(255) NULL AFTER fullName,
            ADD COLUMN reset_expiry DATETIME NULL AFTER reset_token";
    
    $pdo->exec($sql);
    echo json_encode(['success' => true, 'message' => 'Colunas de recuperação de senha adicionadas com sucesso.']);
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode(['success' => true, 'message' => 'As colunas já existem.']);
    } else {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
