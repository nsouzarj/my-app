<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- LISTA COMPLETA DE ENTREGAS ESPERADAS ---\n\n";

$sqlOrgs = "SELECT id, name, reminderDays FROM organizations";
$orgs = $pdo->query($sqlOrgs)->fetchAll();

foreach ($orgs as $org) {
    echo "ORGANIZAÇÃO: {$org['name']} (ID: {$org['id']})\n";
    $defaultDays = (int)$org['reminderDays'];
    
    // Transações que deveriam ser notificadas
    $sqlT = "SELECT id, description, due_date, status, reminderDays 
             FROM transactions 
             WHERE organizationId = ? 
             AND status IN ('planned', 'pending') 
             AND DATE(due_date) <= DATE_ADD(CURDATE(), INTERVAL COALESCE(reminderDays, ?) DAY)";
    
    $stmtT = $pdo->prepare($sqlT);
    $stmtT->execute([$org['id'], $defaultDays]);
    $transactions = $stmtT->fetchAll();
    
    if (empty($transactions)) {
        echo "  - Nenhuma transação para notificar nesta org.\n";
    } else {
        echo "  - Transações a notificar (" . count($transactions) . "):\n";
        foreach ($transactions as $t) {
            echo "    * ID: {$t['id']} | Venc: {$t['due_date']} | Desc: {$t['description']} | Status: {$t['status']}\n";
        }
        
        // Quem deveria receber desta org
        $sqlU = "SELECT u.id, u.email, u.fullName FROM users u 
                 JOIN organization_members om ON u.id = om.userId 
                 WHERE om.organizationId = ?";
        $stmtU = $pdo->prepare($sqlU);
        $stmtU->execute([$org['id']]);
        $users = $stmtU->fetchAll();
        
        if (empty($users)) {
            echo "  ⚠️ ERRO: ESTA ORG TEM CONTAS MAS NÃO TEM USUÁRIOS VINCULADOS!\n";
        } else {
            echo "  - Destinatários esperados:\n";
            foreach ($users as $u) {
                echo "    + {$u['fullName']} ({$u['email']})\n";
                
                // Checar se tem WebPush
                $stmtP = $pdo->prepare("SELECT COUNT(*) FROM user_push_subscriptions WHERE userId = ?");
                $stmtP->execute([$u['id']]);
                $pushCount = $stmtP->fetchColumn();
                echo "      Push: " . ($pushCount > 0 ? "OK ({$pushCount})" : "FALTANDO ❌") . "\n";
            }
        }
    }
    echo "----------------------------------------------------------\n";
}
?>
