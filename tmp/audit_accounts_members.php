<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

echo "AUDITORIA DE CONTAS POR ORGANIZAÇÃO:\n";
$stmt = $pdo->query("SELECT o.name as org_name, a.name as acc_name, a.id as acc_id, a.organizationId 
                    FROM accounts a 
                    JOIN organizations o ON a.organizationId = o.id 
                    ORDER BY o.name, a.name");
foreach ($stmt->fetchAll() as $row) {
    echo "Org: {$row['org_name']} | Conta: {$row['acc_name']} (ID: {$row['acc_id']})\n";
}

echo "\nMEMBROS POR ORGANIZAÇÃO:\n";
$stmtM = $pdo->query("SELECT o.name as org_name, u.email, om.role 
                     FROM organization_members om 
                     JOIN organizations o ON om.organizationId = o.id 
                     JOIN users u ON om.userId = u.id 
                     ORDER BY o.name");
foreach ($stmtM->fetchAll() as $row) {
    echo "Org: {$row['org_name']} | Membro: {$row['email']} ({$row['role']})\n";
}
?>
