<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
$stmt = $pdo->query('DESCRIBE organization_members');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
