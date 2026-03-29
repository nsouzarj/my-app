<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';

$stmtU = $pdo->prepare('SELECT id FROM users WHERE email=?');
$stmtU->execute([$email]);
$uId = $stmtU->fetchColumn();

echo "Auditing transactions for: $email\n\n";

// Get Nelson's orgs
$stmtM = $pdo->prepare("SELECT o.id, o.name FROM organizations o JOIN organization_members om ON o.id = om.organizationId WHERE om.userId = ?");
$stmtM->execute([$uId]);
$orgs = $stmtM->fetchAll(PDO::FETCH_ASSOC);

foreach ($orgs as $org) {
    echo "Organization: {$org['name']} ({$org['id']})\n";
    
    $stmtA = $pdo->prepare("SELECT id, name FROM accounts WHERE organizationId = ?");
    $stmtA->execute([$org['id']]);
    $accs = $stmtA->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($accs as $acc) {
        $stmtT = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE accountId = ?");
        $stmtT->execute([$acc['id']]);
        $count = $stmtT->fetchColumn();
        
        $stmtP = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE accountId = ? AND date > CURRENT_DATE()");
        $stmtP->execute([$acc['id']]);
        $plannedCount = $stmtP->fetchColumn();
        
        echo " - Account: {$acc['name']} | Total Transactions: $count | Planned (date > now): $plannedCount\n";
    }
}

// O que pode ter acontecido:
// No merge original (daquele script antigo), as transacoes do nelson de fato estavam na org do nelson.
// Porem, ele pode ter "planejamentos" em outra tabela? Existe tabela recurring_transactions ou installments?
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "\nTables in DB:\n";
print_r($tables);

?>
