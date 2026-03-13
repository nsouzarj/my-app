<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE categories ADD COLUMN type VARCHAR(50) DEFAULT 'Expense' AFTER name");
    echo "COLUNA TYPE ADICIONADA COM SUCESSO";
} catch (Exception $e) {
    echo "ERRO AO ADICIONAR COLUNA: " . $e->getMessage();
}
?>
