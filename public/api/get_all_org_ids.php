<?php
require_once 'db.php';

$tables = ['transactions', 'accounts', 'categories'];
$results = [];

foreach ($tables as $table) {
    $stmt = $pdo->query("SELECT organizationId, COUNT(*) as count FROM $table GROUP BY organizationId");
    $results[$table] = $stmt->fetchAll();
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
