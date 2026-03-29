<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';

$data = [
    'accounts' => $pdo->query("SELECT a.id, a.name, a.organizationId, o.name as org_name FROM accounts a JOIN organizations o ON a.organizationId = o.id")->fetchAll(PDO::FETCH_ASSOC),
    'members' => $pdo->query("SELECT om.userId, u.email, om.organizationId, o.name as org_name FROM organization_members om JOIN users u ON om.userId = u.id JOIN organizations o ON om.organizationId = o.id")->fetchAll(PDO::FETCH_ASSOC),
    'organizations' => $pdo->query("SELECT id, name FROM organizations")->fetchAll(PDO::FETCH_ASSOC),
    'users' => $pdo->query("SELECT id, email, fullName FROM users")->fetchAll(PDO::FETCH_ASSOC)
];

echo json_encode($data, JSON_PRETTY_PRINT);
?>
