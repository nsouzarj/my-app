<?php
// public/api/find_org_id.php
require_once 'db.php';
$stmt = $pdo->query("SELECT organizationId FROM accounts LIMIT 1");
$id = $stmt->fetchColumn();
echo "ORG_ID:" . $id . ":END";
?>
