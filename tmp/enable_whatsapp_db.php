<?php
require_once 'public/api/db.php';

try {
    $pdo->exec("ALTER TABLE organizations ADD COLUMN whatsappNotifications TINYINT(1) DEFAULT 0");
    echo "Coluna whatsappNotifications adicionada com sucesso na tabela organizations.\n";
} catch (Exception $e) {
    echo "Erro (ou coluna já existe): " . $e->getMessage() . "\n";
}
?>
