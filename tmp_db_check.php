<?php
require_once 'public/api/db.php';
$stmt = $pdo->query('DESCRIBE account_types');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
