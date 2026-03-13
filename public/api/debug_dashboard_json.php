<?php
require_once 'db.php';

$orgId = '3c2ecd8cc00085cf291369725a342f5d';

$trans = $pdo->prepare("SELECT id, description, amount, date, type FROM transactions WHERE organizationId = ?");
$trans->execute([$orgId]);
$transactions = $trans->fetchAll();

$accs = $pdo->prepare("SELECT id, name, balance FROM accounts WHERE organizationId = ?");
$accs->execute([$orgId]);
$accounts = $accs->fetchAll();

$cats = $pdo->prepare("SELECT id, name FROM categories WHERE organizationId = ?");
$cats->execute([$orgId]);
$categories = $cats->fetchAll();

echo json_encode([
    'transactions' => $transactions,
    'accounts' => $accounts,
    'categories' => $categories
], JSON_PRETTY_PRINT);
?>
