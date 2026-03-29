<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- DIAGNÓSTICO DE ESTRUTURA ORG/USUÁRIO ---\n\n";

$orgs = $pdo->query("SELECT id, name, emailNotifications FROM organizations")->fetchAll();
foreach ($orgs as $org) {
    echo "ORG: {$org['name']} (ID: {$org['id']}) | Email Habilitado: {$org['emailNotifications']}\n";
    
    $stmtUsers = $pdo->prepare("SELECT u.id, u.email, u.fullName FROM users u JOIN organization_members om ON u.id = om.userId WHERE om.organizationId = ?");
    $stmtUsers->execute([$org['id']]);
    $users = $stmtUsers->fetchAll();
    
    if (empty($users)) {
        echo "  ⚠️ ATENÇÃO: Nenhum usuário vinculado a esta organização!\n";
    } else {
        foreach ($users as $u) {
            echo "  - Usuário: {$u['fullName']} ({$u['email']})\n";
            $stmtPush = $pdo->prepare("SELECT COUNT(*) FROM user_push_subscriptions WHERE userId = ?");
            $stmtPush->execute([$u['id']]);
            $pushCount = $stmtPush->fetchColumn();
            echo "    Push Subscriptions: {$pushCount}\n";
        }
    }
    
    $stmtT = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE organizationId = ? AND status IN ('planned', 'pending')");
    $stmtT->execute([$org['id']]);
    $txCount = $stmtT->fetchColumn();
    echo "  Total Transações Planejadas/Pendentes: {$txCount}\n";
    echo "------------------------------------------------\n";
}
?>
