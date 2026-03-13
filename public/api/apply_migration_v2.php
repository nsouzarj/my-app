<?php
require_once 'db.php';

$sql = "ALTER TABLE transactions 
ADD COLUMN due_date DATETIME NULL AFTER date,
ADD COLUMN payment_date DATETIME NULL AFTER due_date,
ADD COLUMN status VARCHAR(20) DEFAULT 'paid' AFTER payment_date,
ADD COLUMN is_fixed TINYINT(1) DEFAULT 0 AFTER status";

try {
    $pdo->exec($sql);
    echo "Migration successful!\n";
    
    // Update existing records
    $pdo->exec("UPDATE transactions SET status = 'paid' WHERE status IS NULL");
    echo "Existing records updated to 'paid'.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
