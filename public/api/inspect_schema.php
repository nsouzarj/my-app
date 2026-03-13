<?php
require_once 'db.php';

$tables = ['users', 'transactions', 'accounts', 'categories'];

foreach ($tables as $table) {
    echo "\n--- TABLE: $table ---\n";
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = $stmt->fetchAll();
        foreach ($columns as $col) {
            echo "{$col['Field']} - {$col['Type']}\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
