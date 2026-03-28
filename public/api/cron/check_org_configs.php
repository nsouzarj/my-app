<?php
require_once dirname(__DIR__) . '/db.php';

echo "--- CONFIGURAÇÃO DA ORGANIZAÇÃO ---\n\n";

$sql = "SELECT id, name, reminderDays, emailNotifications, whatsappNotifications FROM organizations";
$orgs = $pdo->query($sql)->fetchAll();

foreach ($orgs as $org) {
    echo "ORG: {$org['name']} (ID: {$org['id']})\n";
    echo "- Aviso: {$org['reminderDays']} dias\n";
    echo "- Email Ativo: " . ($org['emailNotifications'] ? 'SIM' : 'NÃO') . "\n";
    echo "- Zap Ativo: " . ($org['whatsappNotifications'] ? 'SIM' : 'NÃO') . "\n";
    
    // Ver usuários
    echo "- Usuários na Org:\n";
    $stmtU = $pdo->prepare("SELECT u.email, u.fullName FROM users u JOIN organization_members om ON u.id = om.userId WHERE om.organizationId = ?");
    $stmtU->execute([$org['id']]);
    $users = $stmtU->fetchAll();
    foreach ($users as $u) {
        echo "  * {$u['fullName']} ({$u['email']})\n";
    }
    
    echo "---------------------------\n";
}
echo "\n--- FIM ---";
