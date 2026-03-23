<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SELECT id, name, type, creditLimit, closingDay, dueDay FROM accounts ORDER BY createdAt DESC LIMIT 5");
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($accounts)) {
        echo "No accounts found.";
    } else {
        print_r($accounts);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
