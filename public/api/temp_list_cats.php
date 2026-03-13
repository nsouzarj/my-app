<?php
require_once 'db.php';
$organizationId = '3c2ecd8cc00085cf291369725a342f5d';
$stmt = $pdo->prepare("SELECT id, name, type FROM categories WHERE organizationId = ?");
$stmt->execute([$organizationId]);
echo json_encode($stmt->fetchAll());
?>
