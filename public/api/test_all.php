<?php
// public/api/test_all.php
require_once 'db.php';

echo "--- INICIANDO TESTES DE ENDPOINTS ---\n\n";

function test_endpoint($name, $file) {
    global $pdo;
    echo "Testando [$name] ($file)...\n";
    
    // Simular variáveis de servidor para o script incluído
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET['organizationId'] = 'default_org';
    
    // Capturar output
    ob_start();
    include $file;
    $output = ob_get_clean();
    
    $data = json_decode($output, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $count = is_array($data) ? count($data) : (isset($data['success']) ? 1 : 0);
        echo "✅ SUCESSO: JSON Válido. Itens encontrados: $count\n";
        if ($count > 0 && is_array($data) && isset($data[0])) {
            echo "   Exemplo: " . json_encode($data[0], JSON_UNESCAPED_UNICODE) . "\n";
        }
    } else {
        echo "❌ ERRO: Output não é um JSON válido.\n";
        echo "   Raw Output: " . substr($output, 0, 200) . "...\n";
    }
    echo "\n";
}

// Testar cada arquivo
test_endpoint("Accounts", "accounts.php");
test_endpoint("Categories", "categories.php");
test_endpoint("Transactions", "transactions.php");
test_endpoint("Dashboard", "dashboard.php");
test_endpoint("Config", "config.php");

echo "--- TESTES FINALIZADOS ---\n";
?>
