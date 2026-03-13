<?php
require_once 'db.php';

$newOrgId = '3c2ecd8cc00085cf291369725a342f5d';
$oldIds = [
    'user_3ApEYwE56glKLAGxzs0i70xK36F', 
    'org_2u6m2N97PzB49I94m7Fih0xK36F'
];

$report = [];
foreach (['transactions', 'accounts', 'categories'] as $table) {
    $report[$table] = 0;
    foreach ($oldIds as $oldId) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM $table WHERE organizationId = ?");
        $stmt->execute([$oldId]);
        $report[$table] += (int)$stmt->fetchColumn();
    }
}

echo json_encode([
    'newOrgId' => $newOrgId,
    'oldIds' => $oldIds,
    'dataToMigrate' => $report
], JSON_PRETTY_PRINT);
?>
