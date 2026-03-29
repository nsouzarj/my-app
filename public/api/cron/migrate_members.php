<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- MIGRAÇÃO DE MEMBROS --- \n";

$userEmail = 'nsouzarj@outlook.com';
$stmtU = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmtU->execute([$userEmail]);
$userId = $stmtU->fetchColumn();

if (!$userId) {
    echo "Erro: Usuário não encontrado.\n";
    exit;
}

// 1. Identificar Orgs com transações planned/pending
$stmtOrgs = $pdo->query("SELECT id, name FROM organizations");
$allOrgs = $stmtOrgs->fetchAll();

foreach ($allOrgs as $org) {
    $stmtT = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE organizationId = ? AND status IN ('planned', 'pending')");
    $stmtT->execute([$org['id']]);
    $hasTransactions = ((int)$stmtT->fetchColumn() > 0);
    
    if ($hasTransactions) {
        // 2. Verificar se o usuário já é membro
        $stmtM = $pdo->prepare("SELECT COUNT(*) FROM organization_members WHERE userId = ? AND organizationId = ?");
        $stmtM->execute([$userId, $org['id']]);
        $isMember = ((int)$stmtM->fetchColumn() > 0);
        
        if (!$isMember) {
            echo "Adicionando usuário Nelson à Orc '{$org['name']}'...\n";
            $stmtAdd = $pdo->prepare("INSERT INTO organization_members (userId, organizationId, role) VALUES (?, ?, 'admin')");
            $stmtAdd->execute([$userId, $org['id']]);
            echo "  Sucesso! ✅\n";
        } else {
            echo "Usuário já é membro da Org '{$org['name']}'. 🆗\n";
        }
    }
}

echo "\n--- FIM DA MIGRAÇÃO ---\n";
?>
