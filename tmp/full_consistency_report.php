<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

echo "--- RELATÓRIO COMPLETO DE CONSISTÊNCIA ---\n\n";

// 1. Todas as Organizações
$orgs = $pdo->query("SELECT id, name FROM organizations")->fetchAll(PDO::FETCH_ASSOC);
foreach ($orgs as $org) {
    echo "ORGANIZAÇÃO: {$org['name']} (ID: {$org['id']})\n";
    
    // Membros
    $stmtM = $pdo->prepare("SELECT u.email, om.role FROM organization_members om JOIN users u ON om.userId = u.id WHERE om.organizationId = ?");
    $stmtM->execute([$org['id']]);
    $members = $stmtM->fetchAll(PDO::FETCH_ASSOC);
    echo "  Membros (" . count($members) . "):\n";
    foreach ($members as $m) {
        echo "    - {$m['email']} ({$m['role']})\n";
    }
    
    // Contas
    $stmtA = $pdo->prepare("SELECT id, name FROM accounts WHERE organizationId = ?");
    $stmtA->execute([$org['id']]);
    $accs = $stmtA->fetchAll(PDO::FETCH_ASSOC);
    echo "  Contas (" . count($accs) . "):\n";
    foreach ($accs as $acc) {
        echo "    - ID: {$acc['id']} | Nome: {$acc['name']}\n";
    }
    echo "--------------------------------------------------\n";
}

// 2. Órfãos (Contas sem Org ou em Orgs inexistentes - improvável devido a FK, mas vamos checar)
$stmtOrphan = $pdo->query("SELECT a.id, a.name, a.organizationId FROM accounts a LEFT JOIN organizations o ON a.organizationId = o.id WHERE o.id IS NULL");
$orphans = $stmtOrphan->fetchAll(PDO::FETCH_ASSOC);
if (!empty($orphans)) {
    echo "\n!!! ALERTA: CONTAS ÓRFÃS ENCONTRADAS !!!\n";
    foreach ($orphans as $o) {
        echo "  - ID: {$o['id']} | Nome: {$o['name']} | OrgID que não existe: {$o['organizationId']}\n";
    }
} else {
    echo "\nNenhuma conta órfã encontrada.\n";
}
?>
