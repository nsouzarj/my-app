<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';
$stmtOrg = $pdo->query("SELECT id FROM organizations WHERE name = 'Finanças Pessoais' LIMIT 1");
$orgId = $stmtOrg->fetchColumn();

if (!$orgId) {
    echo "Org não encontrada.\n";
    exit;
}

echo "Finanças Pessoais ID: $orgId\n";

$sql = "SELECT id, description, due_date, status, organizationId 
        FROM transactions 
        WHERE organizationId = ? 
        AND status IN ('planned', 'pending')";
$stmt = $pdo->prepare($sql);
$stmt->execute([$orgId]);
$txs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Contas em Finanças Pessoais (Planned/Pending): " . count($txs) . "\n";
foreach ($txs as $t) {
    echo " - [{$t['status']}] {$t['description']} | Vencimento: {$t['due_date']}\n";
}

$curDate = date('Y-m-d');
echo "\nData Atual: $curDate\n";

$stmtOrgInfo = $pdo->prepare("SELECT reminderDays FROM organizations WHERE id = ?");
$stmtOrgInfo->execute([$orgId]);
$defaultDays = (int)$stmtOrgInfo->fetchColumn();
echo "ReminderDays (Org): $defaultDays\n";

foreach ($txs as $t) {
    $dueDate = date('Y-m-d', strtotime($t['due_date']));
    $threshold = date('Y-m-d', strtotime("+$defaultDays days", strtotime($curDate)));
    
    $isEligible = ($dueDate <= $threshold);
    echo "Conta: {$t['description']} | Vencimento: $dueDate | Threshold: $threshold | Elegível: " . ($isEligible ? 'SIM' : 'NÃO') . "\n";
}
?>
