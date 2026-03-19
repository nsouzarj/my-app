<?php
/**
 * Suíte de Testes da API (Integrated)
 * 
 * Este script realiza testes funcionais nos endpoints da API PHP,
 * simulando requisições e validando o comportamento.
 */

require_once 'db.php';

// Configurações de teste
$testOrgId = 'test_automation_org_' . uniqid();
define('TEST_ORG_ID', $testOrgId);

echo "--- INICIANDO SUÍTE DE TESTES (ORG: " . TEST_ORG_ID . ") ---\n\n";

// --- Utilitários de Teste ---

/**
 * Simula uma requisição para um arquivo PHP da API
 */
function request($file, $method = 'GET', $data = [], $params = []) {
    global $testOrgId, $pdo;
    
    // Backup das globais
    $oldServer = $_SERVER;
    $oldGet = $_GET;
    
    // Configura ambiente
    $_SERVER['REQUEST_METHOD'] = $method;
    $_GET = array_merge(['organizationId' => TEST_ORG_ID], $params);
    
    if ($method === 'POST' || $method === 'PUT') {
        $GLOBALS['MOCK_INPUT'] = json_encode(array_merge($data, ['organizationId' => TEST_ORG_ID]));
    }
    
    // Captura output
    ob_start();
    try {
        include $file;
    } catch (Exception $e) {
        echo "Exceção no script: " . $e->getMessage();
    }
    $output = ob_get_clean();
    
    // Limpa mocks
    unset($GLOBALS['MOCK_INPUT']);
    
    // Restaura globais
    $_SERVER = $oldServer;
    $_GET = $oldGet;
    
    return $output;
}

// --- SETUP PRÉ-TESTE (Necessário para accounts.php não falhar na transação inicial) ---
echo "--- PREPARANDO AMBIENTE ---\n";
try {
    $stmt = $pdo->prepare("INSERT IGNORE INTO categories (id, name, type, color, organizationId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute(['16272b2fbb47d1feb74e94cfeed9032a', 'Outros', 'both', '#cccccc', TEST_ORG_ID]);
    echo "✅ Categoria 'Outros' preparada.\n";
} catch (Exception $e) {
    echo "⚠️ Erro ao preparar categoria: " . $e->getMessage() . "\n";
}

$results = ['passed' => 0, 'failed' => 0];

function assert_equals($expected, $actual, $message) {
    global $results;
    if ($expected == $actual) {
        echo "✅ " . $message . "\n";
        $results['passed']++;
        return true;
    } else {
        echo "❌ " . $message . " (Esperado: " . json_encode($expected) . ", Recebido: " . json_encode($actual) . ")\n";
        $results['failed']++;
        return false;
    }
}

function assert_json($output, $message) {
    global $results;
    $data = json_decode($output, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✅ " . $message . "\n";
        $results['passed']++;
        return $data;
    } else {
        echo "❌ " . $message . " (Output não é JSON válido)\n";
        echo "--- RAW OUTPUT START ---\n" . $output . "\n--- RAW OUTPUT END ---\n";
        $results['failed']++;
        return null;
    }
}

// --- FLUXO DE TESTES ---

$state = [
    'categoryId' => null,
    'accountId' => null,
    'transactionId' => null
];

// 1. CATEGORIAS
echo "--- TESTANDO CATEGORIAS ---\n";

// Create
$out = request('categories.php', 'POST', [
    'name' => 'Alimentação Teste',
    'type' => 'expense',
    'color' => '#FF0000'
]);
$resp = assert_json($out, "Criar categoria retorna JSON");
if ($resp && isset($resp['id'])) {
    $state['categoryId'] = $resp['id'];
    echo "   ID criado: " . $state['categoryId'] . "\n";
}

// List
$out = request('categories.php', 'GET');
$list = assert_json($out, "Listar categorias retorna JSON");
if ($list) {
    $found = false;
    foreach($list as $c) if($c['id'] == $state['categoryId']) $found = true;
    assert_equals(true, $found, "Categoria criada deve estar na listagem");
}

// Update
$out = request('categories.php', 'PUT', [
    'name' => 'Alimentação Updated',
    'type' => 'expense',
    'color' => '#00FF00'
], ['id' => $state['categoryId']]);
assert_json($out, "Atualizar categoria retorna JSON");

// Verify Update
$out = request('categories.php', 'GET');
$list = assert_json($out, "Listar categorias após update");
if ($list) {
    foreach($list as $c) {
        if($c['id'] == $state['categoryId']) {
            assert_equals('Alimentação Updated', $c['name'], "Nome da categoria deve ser o atualizado");
        }
    }
}

// 2. CONTAS
echo "\n--- TESTANDO CONTAS ---\n";

// Create
$out = request('accounts.php', 'POST', [
    'name' => 'Banco Teste',
    'type' => 'checking',
    'balance' => 1000.00
]);
$resp = assert_json($out, "Criar conta retorna JSON");
if ($resp && isset($resp['id'])) {
    $state['accountId'] = $resp['id'];
    echo "   ID criado: " . $state['accountId'] . "\n";
}

// Verify Initial Balance & Auto Transaction
$out = request('transactions.php', 'GET', [], ['accountId' => $state['accountId']]);
$txs = assert_json($out, "Listar transações da nova conta");
if ($txs) {
    assert_equals(1, count($txs), "Nova conta com saldo inicial deve ter 1 transação automática");
    assert_equals(1000.0, (float)$txs[0]['amount'], "Valor da transação inicial deve ser 1000");
}

// 3. TRANSAÇÕES
echo "\n--- TESTANDO TRANSAÇÕES ---\n";

// Create Expense
$out = request('transactions.php', 'POST', [
    'amount' => 150.50,
    'description' => 'Jantar Teste',
    'date' => date('Y-m-d'),
    'type' => 'expense',
    'accountId' => $state['accountId'],
    'categoryId' => $state['categoryId'],
    'status' => 'paid'
]);
$resp = assert_json($out, "Criar despesa retorna JSON");
if ($resp && isset($resp['id'])) {
    $state['transactionId'] = $resp['id'];
}

// Verify Account Balance (1000 - 150.50 = 849.50)
$out = request('accounts.php', 'GET');
$accs = assert_json($out, "Listar contas para ver saldo");
if ($accs) {
    foreach($accs as $a) {
        if($a['id'] == $state['accountId']) {
            assert_equals(849.50, (float)$a['balance'], "Saldo da conta após despesa deve ser 849.50");
        }
    }
}

// Create Income
$out = request('transactions.php', 'POST', [
    'amount' => 500.00,
    'description' => 'Freelance Teste',
    'date' => date('Y-m-d'),
    'type' => 'income',
    'accountId' => $state['accountId'],
    'categoryId' => $state['categoryId'],
    'status' => 'paid'
]);
assert_json($out, "Criar receita retorna JSON");

// Verify Dashboard
echo "\n--- TESTANDO DASHBOARD ---\n";
$out = request('dashboard.php', 'GET');
$dash = assert_json($out, "Dashboard retorna JSON");
if ($dash) {
    // Balanço: 1000 (inicial) - 150.50 (despesa) + 500 (receita) = 1349.50
    assert_equals(1349.50, (float)$dash['totalBalance'], "Saldo total no dashboard deve ser 1349.50");
}

// --- LIMPEZA ---
echo "\n--- LIMPANDO DADOS DE TESTE ---\n";
$pdo->prepare("DELETE FROM transactions WHERE organizationId = ?")->execute([TEST_ORG_ID]);
$pdo->prepare("DELETE FROM accounts WHERE organizationId = ?")->execute([TEST_ORG_ID]);
$pdo->prepare("DELETE FROM categories WHERE organizationId = ?")->execute([TEST_ORG_ID]);
echo "✅ Dados limpos.\n";

echo "\n--- RESUMO DOS TESTES ---\n";
echo "Passou: " . $results['passed'] . "\n";
echo "Falhou: " . $results['failed'] . "\n";

if ($results['failed'] > 0) {
    exit(1);
} else {
    exit(0);
}
