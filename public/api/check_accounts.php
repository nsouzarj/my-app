<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SELECT count(*) as count FROM accounts");
    echo "Accounts: " . $stmt->fetch()['count'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
