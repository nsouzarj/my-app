<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- RELATÓRIO FINAL DE ÓRFÃOS ---\n";

$orgs = $pdo->query("SELECT id, name FROM organizations")->fetchAll();

foreach ($orgs as $org) {
    echo "ORG: {$org['name']} (ID: {$org['id']})\n";
    
    // Usuários desta org
    $stmtU = $pdo->prepare("SELECT u.fullName, u.email FROM users u JOIN organization_members om ON u.id = om.userId WHERE om.organizationId = ?");
    $stmtU->execute([$org['id']]);
    $users = $stmtU->fetchAll();
    
    // Transações pendentes desta org
    $stmtT = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE organizationId = ? AND status IN ('planned', 'pending')");
    $stmtT->execute([$org['id']]);
    $count = $stmtT->fetchColumn();
    
    if (empty($users) && $count > 0) {
        echo "  ⚠️ CRÍTICO: Esta org tem {$count} transações mas NINGUÉM é membro! Ninguém recebe notif.\n";
    } elseif ($count > 0) {
        echo "  Membros ({" . count($users) . "}):\n";
        foreach ($users as $u) {
            echo "    - {$u['fullName']} ({$u['email']})\n";
        }
    } else {
        echo "  Nenhuma transação pendente.\n";
    }
    echo "--------------------------------------------------\n";
}
?>
