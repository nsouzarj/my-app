<?php
require_once 'db.php';

$orgId = '3c2ecd8cc00085cf291369725a342f5d';

echo "--- DATA FOR ORG: $orgId ---\n";

$trans = $pdo->prepare("SELECT id, description, amount, date, type FROM transactions WHERE organizationId = ?");
$trans->execute([$orgId]);
echo "\nTRANSACTIONS:\n";
print_r($trans->fetchAll());

$accs = $pdo->prepare("SELECT id, name, balance FROM accounts WHERE organizationId = ?");
$accs->execute([$orgId]);
echo "\nACCOUNTS:\n";
print_r($accs->fetchAll());

$cats = $pdo->prepare("SELECT id, name FROM categories WHERE organizationId = ?");
$cats->execute([$orgId]);
echo "\nCATEGORIES:\n";
print_r($cats->fetchAll());
?>
