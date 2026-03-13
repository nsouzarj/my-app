<?php
require 'public/api/db.php';
$stmt = $pdo->query('SELECT DISTINCT organizationId FROM transactions LIMIT 5');
while ($r = $stmt->fetch(PDO::FETCH_NUM)) {
    echo $r[0] . PHP_EOL;
}

echo "\n--- accounts ---\n";
$stmt = $pdo->query('SELECT DISTINCT organizationId FROM accounts LIMIT 5');
while ($r = $stmt->fetch(PDO::FETCH_NUM)) {
    echo $r[0] . PHP_EOL;
}

echo "\n--- counts ---\n";
$stmt = $pdo->query('SELECT COUNT(*) as total FROM transactions');
echo "Transactions: " . $stmt->fetch()['total'] . PHP_EOL;

$stmt = $pdo->query('SELECT COUNT(*) as total FROM accounts');
echo "Accounts: " . $stmt->fetch()['total'] . PHP_EOL;
?>
