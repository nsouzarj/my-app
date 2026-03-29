<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

echo "--- USUÁRIOS NO SISTEMA ---\n";
$users = $pdo->query("SELECT id, email, fullName FROM users")->fetchAll();
foreach ($users as $u) {
    echo "ID: {$u['id']} | Email: {$u['email']} | Nome: {$u['fullName']}\n";
    
    // Listar Orgs deste usuário
    $stmt = $pdo->prepare("SELECT o.name, o.id FROM organizations o JOIN organization_members om ON o.id = om.organizationId WHERE om.userId = ?");
    $stmt->execute([$u['id']]);
    $orgs = $stmt->fetchAll();
    foreach ($orgs as $org) {
        echo "  -> Org: {$org['name']} (ID: {$org['id']})\n";
        
        // Listar Contas desta Org
        $stmtA = $pdo->prepare("SELECT name, id FROM accounts WHERE organizationId = ?");
        $stmtA->execute([$org['id']]);
        $accs = $stmtA->fetchAll();
        foreach ($accs as $acc) {
            echo "     - Conta: {$acc['name']} (ID: {$acc['id']})\n";
        }
    }
    echo "\n";
}
?>
