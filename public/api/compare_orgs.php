<?php
require_once 'db.php';

echo "--- NEW ORGANIZATIONS (RECENTLY CREATED) ---\n";
$orgs = $pdo->query("SELECT id, name FROM organizations ORDER BY createdAt DESC LIMIT 5")->fetchAll();
print_r($orgs);

echo "\n--- UNIQUE ORGANIZATION IDs IN TRANSACTIONS ---\n";
$transOrgs = $pdo->query("SELECT organizationId, COUNT(*) as count FROM transactions GROUP BY organizationId")->fetchAll();
print_r($transOrgs);

echo "\n--- UNIQUE ORGANIZATION IDs IN ACCOUNTS ---\n";
$accOrgs = $pdo->query("SELECT organizationId, COUNT(*) as count FROM accounts GROUP BY organizationId")->fetchAll();
print_r($accOrgs);
?>
