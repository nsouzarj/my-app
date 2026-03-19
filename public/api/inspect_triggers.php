<?php
require_once 'db.php';
$stmt = $pdo->query('SHOW TRIGGERS');
$triggers = $stmt->fetchAll();
if (empty($triggers)) {
    echo "No triggers found.\n";
} else {
    foreach ($triggers as $t) {
        echo "Trigger: " . $t['Trigger'] . "\n";
        echo "Event: " . $t['Event'] . "\n";
        echo "Table: " . $t['Table'] . "\n";
        echo "Statement: " . $t['Statement'] . "\n\n";
    }
}
?>
