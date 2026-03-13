<?php
require_once 'db.php';

echo "--- USERS ---\n";
$users = $pdo->query("SELECT id, name, organizationId FROM users")->fetchAll();
print_r($users);

echo "\n--- ORGANIZATIONS IN TRANSACTIONS ---\n";
$trans = $pdo->query("SELECT organizationId, COUNT(*) as count FROM transactions GROUP BY organizationId")->fetchAll();
print_r($trans);

echo "\n--- ORGANIZATIONS IN ACCOUNTS ---\n";
$accs = $pdo->query("SELECT organizationId, COUNT(*) as count FROM accounts GROUP BY organizationId")->fetchAll();
print_r($accs);

echo "\n--- ORGANIZATIONS IN CATEGORIES ---\n";
$cats = $pdo->query("SELECT organizationId, COUNT(*) as count FROM categories GROUP BY organizationId")->fetchAll();
print_r($cats);
?>
