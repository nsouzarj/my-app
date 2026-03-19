<?php
require_once 'db.php';
$testOrgId = 'debug_org_' . uniqid();
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['organizationId'] = $testOrgId;
$data = [
    'name' => 'Conta Debug',
    'type' => 'checking',
    'balance' => 500.0,
    'organizationId' => $testOrgId
];
$GLOBALS['MOCK_INPUT'] = json_encode($data);

echo "Iniciando teste de accounts.php...\n";
try {
    include 'accounts.php';
} catch (PDOException $e) {
    echo "EXCEÇÃO NA TRANSAÇÃO: " . $e->getMessage() . "\n";
    
    // VERIFICAR SE A CONTA FOI CRIADA APESAR DO ERRO NA TRANSAÇÃO
    $stmt = $pdo->prepare("SELECT * FROM accounts WHERE organizationId = ?");
    $stmt->execute([$testOrgId]);
    $acc = $stmt->fetch();
    if ($acc) {
        echo "CONTA CRIADA COM SUCESSO: " . json_encode($acc) . "\n";
    } else {
        echo "CONTA NÃO FOI CRIADA.\n";
    }
}
?>
