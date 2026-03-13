<?php
// public/api/dashboard.php
require_once 'db.php';

$organizationId = $_GET['organizationId'] ?? 'default_org';
$now = new DateTime();
$startOfMonth = (clone $now)->modify('first day of this month')->format('Y-m-d 00:00:00');
$endOfMonth = (clone $now)->modify('last day of this month')->format('Y-m-d 23:59:59');

// 1. Total Balance
$stmt = $pdo->prepare("SELECT SUM(balance) as total FROM accounts WHERE organizationId = ?");
$stmt->execute([$organizationId]);
$totalBalance = (float)$stmt->fetch()['total'];

// 2. Monthly Income
$stmt = $pdo->prepare("SELECT SUM(amount) as income FROM transactions 
                       WHERE organizationId = ? AND LOWER(type) = 'income' AND date >= ? AND date <= ?");
$stmt->execute([$organizationId, $startOfMonth, $endOfMonth]);
$monthlyIncome = (float)$stmt->fetch()['income'];

// 3. Monthly Expenses
$stmt = $pdo->prepare("SELECT SUM(amount) as expense FROM transactions 
                       WHERE organizationId = ? AND LOWER(type) = 'expense' AND date >= ? AND date <= ?");
$stmt->execute([$organizationId, $startOfMonth, $endOfMonth]);
$monthlyExpenses = (float)$stmt->fetch()['expense'];

// 4. Recent Transactions
$stmt = $pdo->prepare("SELECT t.*, a.name as accountName, c.name as categoryName, c.color as categoryColor
                       FROM transactions t 
                       LEFT JOIN accounts a ON t.accountId = a.id 
                       LEFT JOIN categories c ON t.categoryId = c.id
                       WHERE t.organizationId = ? 
                       ORDER BY t.date DESC LIMIT 5");
$stmt->execute([$organizationId]);
$recentTransactions = $stmt->fetchAll();
foreach ($recentTransactions as &$t) $t['amount'] = (float)$t['amount'];

// 5. Account Breakdown
$stmt = $pdo->prepare("SELECT * FROM accounts WHERE organizationId = ?");
$stmt->execute([$organizationId]);
$accounts = $stmt->fetchAll();
foreach ($accounts as &$acc) $acc['balance'] = (float)$acc['balance'];

// 6. Category Breakdown
$stmt = $pdo->prepare("SELECT c.name, c.color, SUM(t.amount) as value 
                       FROM transactions t 
                       JOIN categories c ON t.categoryId = c.id 
                       WHERE t.organizationId = ? AND LOWER(t.type) = 'expense' AND t.date >= ? AND t.date <= ? 
                       GROUP BY c.name, c.color ORDER BY value DESC");
$stmt->execute([$organizationId, $startOfMonth, $endOfMonth]);
$categories = $stmt->fetchAll();

$categoryBreakdown = [];
foreach ($categories as $cat) {
    $categoryBreakdown[] = [
        'name' => $cat['name'],
        'value' => (float)$cat['value'],
        'color' => $cat['color'] ?? '#3b82f6'
    ];
}

// 7. Bills Summary (Pending/Overdue)
$stmt = $pdo->prepare("SELECT 
    COUNT(*) as count, 
    SUM(amount) as total 
    FROM transactions 
    WHERE organizationId = ? AND LOWER(type) = 'expense' AND status = 'pending'");
$stmt->execute([$organizationId]);
$pendingBills = $stmt->fetch();

$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM transactions 
                        WHERE organizationId = ? AND LOWER(type) = 'expense' AND status = 'pending' AND due_date <= ?");
$stmt->execute([$organizationId, $now->format('Y-m-d 23:59:59')]);
$overdueCount = (int)$stmt->fetch()['count'];

echo json_encode([
    'totalBalance' => $totalBalance,
    'remaining' => $totalBalance,
    'monthlyIncome' => $monthlyIncome,
    'income' => $monthlyIncome,
    'monthlyExpenses' => $monthlyExpenses,
    'expenses' => $monthlyExpenses,
    'incomeChange' => '+0%',
    'expenseChange' => '+0%',
    'balanceChange' => '+0%',
    'accounts' => $accounts,
    'recentTransactions' => $recentTransactions,
    'categoryBreakdown' => $categoryBreakdown,
    'pendingBills' => [
        'count' => (int)$pendingBills['count'],
        'total' => (float)$pendingBills['total'],
        'overdueCount' => $overdueCount
    ]
]);
?>
