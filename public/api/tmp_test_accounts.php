<?php
require_once 'db.php';
$testOrgId = 'debug_org_' . uniqid();
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['organizationId'] = $testOrgId;
$GLOBALS['MOCK_INPUT'] = json_encode([
    'name' => 'Conta Debug',
    'type' => 'checking',
    'balance' => 500.0,
    'organizationId' => $testOrgId
]);

echo "Iniciando teste de accounts.php...\n";
try {
    include 'accounts.php';
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "TRACE: " . $e->getTraceAsString() . "\n";
}
?>
