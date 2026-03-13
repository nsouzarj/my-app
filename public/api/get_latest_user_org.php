<?php
require_once 'db.php';

$res = $pdo->query("SELECT u.email, om.organizationId 
                   FROM users u 
                   JOIN organization_members om ON u.id = om.userId 
                   ORDER BY u.createdAt DESC LIMIT 1")->fetch();

echo json_encode($res, JSON_PRETTY_PRINT);
?>
