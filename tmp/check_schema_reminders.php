<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

function check($table) {
    global $pdo;
    echo "COLUMNS FOR $table:\n";
    $stmt = $pdo->query("DESCRIBE $table");
    foreach ($stmt->fetchAll() as $col) {
        echo " - {$col['Field']} ({$col['Type']})\n";
    }
    echo "\n";
}

check('users');
check('transactions');
check('organizations');
?>
