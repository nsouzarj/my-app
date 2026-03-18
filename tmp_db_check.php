<?php
require 'public/api/db.php';
$stmt = $pdo->query("SHOW CREATE TABLE categories");
print_r($stmt->fetch());
