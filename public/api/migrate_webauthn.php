<?php
// my-app/public/api/migrate_webauthn.php
require_once 'db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS user_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        credentialId VARCHAR(512) NOT NULL,
        publicKey TEXT NOT NULL,
        signCount INT DEFAULT 0,
        userAgent TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uni_credentialId (credentialId),
        KEY idx_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo json_encode(['success' => true, 'message' => 'Tabela user_credentials criada com sucesso.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
