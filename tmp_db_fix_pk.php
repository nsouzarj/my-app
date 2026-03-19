<?php
require_once 'public/api/db.php';
try {
    // 1. Drop existing primary key
    $pdo->exec('ALTER TABLE account_types DROP PRIMARY KEY');
    // 2. Add composite primary key (id, organizationId)
    $pdo->exec('ALTER TABLE account_types ADD PRIMARY KEY (id, organizationId)');
    echo "Primary Key updated to (id, organizationId) successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
