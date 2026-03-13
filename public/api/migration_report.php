<?php
require_once 'db.php';

$newOrgId = '3c2ecd8cc00085cf291369725a342f5d';
$oldIds = ['user_3ApEYwE56glKLAGxzs0i70xTswG', 'org_2u6m2N97PzB49I94m7Fih0xK36F'];

$report = [];

foreach (['transactions', 'accounts', 'categories'] as $table) {
    foreach ($oldIds as $oldId) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM $table WHERE organizationId = ?");
        $stmt->execute([$oldId]);
        $count = $stmt->fetchColumn();
        if ($count > 0) {
            $report[$table][$oldId] = $count;
        }
    }
}

echo json_encode($report, JSON_PRETTY_PRINT);
?>
