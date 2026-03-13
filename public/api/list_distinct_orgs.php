<?php
require_once 'db.php';

$tables = ['transactions', 'accounts', 'categories'];
$allIds = [];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT DISTINCT organizationId FROM $table");
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($ids as $id) {
            if ($id) $allIds[$id] = true;
        }
    } catch (Exception $e) {}
}

foreach (array_keys($allIds) as $id) {
    echo $id . "\n";
}
?>
