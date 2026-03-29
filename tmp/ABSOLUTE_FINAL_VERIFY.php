<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';

// 1. User ID
$stmtU = $pdo->prepare('SELECT id FROM users WHERE email=?');
$stmtU->execute([$email]);
$uId = $stmtU->fetchColumn();

// 2. Organization counting
$stmtM = $pdo->prepare('SELECT COUNT(*) FROM organization_members WHERE userId=?');
$stmtM->execute([$uId]);
echo "Memberships for $email: " . $stmtM->fetchColumn() . "\n";

// 3. Account counting (only for those the user has access to)
$stmtA = $pdo->prepare("SELECT a.name, o.name as org_name 
                       FROM accounts a 
                       JOIN organizations o ON a.organizationId = o.id 
                       JOIN organization_members om ON o.id = om.organizationId 
                       WHERE om.userId = ?");
$stmtA->execute([$uId]);
$accs = $stmtA->fetchAll(PDO::FETCH_ASSOC);

echo "Total Accounts visible for $email: " . count($accs) . "\n";
foreach ($accs as $acc) {
    echo " -> Conta: {$acc['name']} (Org: {$acc['org_name']})\n";
}
?>
