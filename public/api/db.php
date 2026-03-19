<?php
// public/api/db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$host = 'host4527.hospedameusite.net';
$db   = 'nsouzaet_finandb';
$user = 'nsouzaet_root';
$pass = '#Nso196840';
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

function recalculateAccountBalance($pdo, $accountId) {
    if (empty($accountId)) return;

    // 1. Somar todas as receitas (income)
    $stmtInc = $pdo->prepare("SELECT SUM(amount) FROM transactions WHERE accountId = ? AND (LOWER(type) = 'income' OR type = 'income')");
    $stmtInc->execute([$accountId]);
    $totalIncome = (float)$stmtInc->fetchColumn();

    // 2. Somar todas as despesas (expense)
    $stmtExp = $pdo->prepare("SELECT SUM(amount) FROM transactions WHERE accountId = ? AND (LOWER(type) = 'expense' OR type = 'expense')");
    $stmtExp->execute([$accountId]);
    $totalExpense = (float)$stmtExp->fetchColumn();

    $finalBalance = $totalIncome - $totalExpense;

    // 3. Atualizar a conta com o valor real calculado
    $stmtUpd = $pdo->prepare("UPDATE accounts SET balance = ?, updatedAt = NOW() WHERE id = ?");
    $stmtUpd->execute([$finalBalance, $accountId]);
}
?>
