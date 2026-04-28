<?php
// public/api/db.php
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';

if ($origin !== '*') {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // If there is no origin (e.g. server-to-server or direct access)
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$envPath = __DIR__ . '/../../.env';
$envVars = [];
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value, " \t\n\r\0\x0B\"'"); // remove quotes
            $envVars[$name] = $value;
        }
    }
}

$host = $envVars['DB_HOST'] ?? 'localhost';
$db   = $envVars['DB_NAME'] ?? '';
$user = $envVars['DB_USER'] ?? '';
$pass = $envVars['DB_PASS'] ?? '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
    exit;
}

function getJsonInput() {
    if (isset($GLOBALS['MOCK_INPUT'])) {
        return json_decode($GLOBALS['MOCK_INPUT'], true);
    }
    return json_decode(file_get_contents('php://input'), true);
}

/**
 * Segurança de Elite: Argon2id + Pepper
 * A 'Pepper' é uma chave secreta mantida fora do banco de dados (neste arquivo).
 * Se o banco vazar, o atacante não consegue nem começar o crack das senhas sem esta chave.
 */
define('AUTH_PEPPER', 'f1n4nc4s_pr3m1um_s3cr3t_2025_!@#');

function hashUserPassword($password) {
    // Combina a senha do usuário com a pimenta secreta
    $peppered = hash_hmac('sha256', $password, AUTH_PEPPER);
    return password_hash($peppered, PASSWORD_ARGON2ID);
}

function verifyUserPassword($password, $hash) {
    // 1. Tentar verificar com a pimenta (Novo padrão)
    $peppered = hash_hmac('sha256', $password, AUTH_PEPPER);
    if (password_verify($peppered, $hash)) {
        return true;
    }
    
    // 2. Tentar verificar sem a pimenta (Legado/Bcrypt antigo)
    if (password_verify($password, $hash)) {
        return 'needs_rehash'; // Indica que a senha está correta mas precisa ser atualizada com a pimenta
    }
    
    return false;
}

function recalculateAccountBalance($pdo, $accountId) {
    if (empty($accountId)) return;

    // 1. Somar todas as receitas (income)
    $stmtInc = $pdo->prepare("SELECT SUM(amount) FROM transactions WHERE accountId = ? AND (LOWER(type) = 'income' OR type = 'income') AND status = 'paid'");
    $stmtInc->execute([$accountId]);
    $totalIncome = (float)$stmtInc->fetchColumn();

    // 2. Somar todas as despesas (expense)
    $stmtExp = $pdo->prepare("SELECT SUM(amount) FROM transactions WHERE accountId = ? AND (LOWER(type) = 'expense' OR type = 'expense') AND status = 'paid'");
    $stmtExp->execute([$accountId]);
    $totalExpense = (float)$stmtExp->fetchColumn();

    $finalBalance = $totalIncome - $totalExpense;

    // 3. Atualizar a conta com o valor real calculado
    $stmtUpd = $pdo->prepare("UPDATE accounts SET balance = ?, updatedAt = NOW() WHERE id = ?");
    $stmtUpd->execute([$finalBalance, $accountId]);
}
?>
