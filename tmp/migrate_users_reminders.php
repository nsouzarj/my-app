<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN reminderDays INT DEFAULT 7");
    echo "Sucesso: Coluna reminderDays adicionada à tabela users.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Aviso: A coluna reminderDays já existe.\n";
    } else {
        echo "Erro: " . $e->getMessage() . "\n";
    }
}
?>
