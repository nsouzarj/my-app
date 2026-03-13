<?php
require 'public/api/db.php';
$stmt = $pdo->query('SELECT id FROM organizations LIMIT 1');
echo $stmt->fetchColumn();
?>
