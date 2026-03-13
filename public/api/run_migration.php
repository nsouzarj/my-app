<?php
require_once 'db.php';

$newOrgId = '3c2ecd8cc00085cf291369725a342f5d';
$oldIds = [
    'user_3ApEYwE56glKLAGxzs0i70xK36F', 
    'org_2u6m2N97PzB49I94m7Fih0xK36F'
];

$results = [];

try {
    $pdo->beginTransaction();

    foreach (['transactions', 'accounts', 'categories'] as $table) {
        $totalUpdated = 0;
        foreach ($oldIds as $oldId) {
            $stmt = $pdo->prepare("UPDATE $table SET organizationId = ? WHERE organizationId = ?");
            $stmt->execute([$newOrgId, $oldId]);
            $totalUpdated += $stmt->rowCount();
        }
        $results[$table] = $totalUpdated;
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'migrated' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
?>
