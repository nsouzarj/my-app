<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- RELAÇÃO DE ORGS E PERMISSÕES DO USUÁRIO PRINCIPAL ---\n";

// Nelson's email from previous logs: nsouzarj@outlook.com
$userEmail = 'nsouzarj@outlook.com';
$stmtU = $pdo->prepare("SELECT id, fullName FROM users WHERE email = ?");
$stmtU->execute([$userEmail]);
$user = $stmtU->fetch();

if (!$user) {
    echo "Erro: Usuário principal não encontrado.\n";
    exit;
}

echo "Usuário: {$user['fullName']} (ID: {$user['id']})\n\n";

// Orgs que ele É membro
$stmtM = $pdo->prepare("SELECT o.id, o.name FROM organizations o JOIN organization_members om ON o.id = om.organizationId WHERE om.userId = ?");
$stmtM->execute([$user['id']]);
$myOrgs = $stmtM->fetchAll();
$myOrgIds = array_column($myOrgs, 'id');

echo "Organizações que o usuário É membro:\n";
foreach ($myOrgs as $mo) {
    echo "- {$mo['name']} (ID: {$mo['id']})\n";
}

// Todas as Orgs com transações planned/pending
echo "\nVerificando TODAS as Orgs com transações pendentes/planejadas:\n";
$stmtAll = $pdo->query("SELECT id, name FROM organizations");
$allOrgs = $stmtAll->fetchAll();

foreach ($allOrgs as $ao) {
    $stmtT = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE organizationId = ? AND status IN ('planned', 'pending')");
    $stmtT->execute([$ao['id']]);
    $count = $stmtT->fetchColumn();
    
    if ($count > 0) {
        $isMember = in_array($ao['id'], $myOrgIds);
        $statusStr = $isMember ? "✅ Membro" : "❌ NÃO É MEMBRO (Não recebe Notif!)";
        echo "Org: {$ao['name']} | Transações: {$count} | Status: {$statusStr}\n";
    }
}
?>
