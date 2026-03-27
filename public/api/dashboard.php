<?php
// public/api/dashboard.php
require_once 'db.php';

$organizationId = $_GET['organizationId'] ?? 'default_org';
$startDateInput = $_GET['startDate'] ?? null;
$endDateInput = $_GET['endDate'] ?? null;

if ($startDateInput && $endDateInput) {
    $startOfMonth = $startDateInput . ' 00:00:00';
    $endOfMonth = $endDateInput . ' 23:59:59';
} else {
    $monthParam = $_GET['month'] ?? null;
    $yearParam = $_GET['year'] ?? null;
    
    if ($monthParam && $yearParam) {
        try {
            $now = new DateTime("$yearParam-$monthParam-01");
        } catch (Exception $e) {
            $now = new DateTime();
        }
    } else {
        $now = new DateTime();
    }
    
    $startOfMonth = (clone $now)->modify('first day of this month')->format('Y-m-d 00:00:00');
    $endOfMonth = (clone $now)->modify('last day of this month')->format('Y-m-d 23:59:59');
}

$actualNow = new DateTime();

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

// 4. Recent Transactions (Mês Específico)
$stmt = $pdo->prepare("SELECT t.*, a.name as accountName, c.name as categoryName, c.color as categoryColor
                       FROM transactions t 
                       LEFT JOIN accounts a ON t.accountId = a.id 
                       LEFT JOIN categories c ON t.categoryId = c.id
                       WHERE t.organizationId = ? AND t.date >= ? AND t.date <= ?
                       ORDER BY t.date DESC, t.createdAt DESC LIMIT 5");
$stmt->execute([$organizationId, $startOfMonth, $endOfMonth]);
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

// 7. Bills Summary (Pending/Planned/Overdue)
$stmt = $pdo->prepare("SELECT 
    COUNT(*) as count, 
    SUM(amount) as total 
    FROM transactions 
    WHERE organizationId = ? AND LOWER(type) = 'expense' AND (status = 'pending' OR status = 'planned')");
$stmt->execute([$organizationId]);
$allUpcomingBills = $stmt->fetch();

// 8. Overdue Count
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM transactions 
                        WHERE organizationId = ? AND LOWER(type) = 'expense' AND (status = 'pending' OR status = 'planned') AND due_date < ?");
$stmt->execute([$organizationId, $actualNow->format('Y-m-d 00:00:00')]);
$overdueCount = (int)$stmt->fetch()['count'];

// 9. Upcoming Alerts (N dias definidos pelo usuário)
$reminderDays = isset($_GET['reminderDays']) ? (int)$_GET['reminderDays'] : 7;
$upcomingLimit = (clone $actualNow)->modify("+$reminderDays days")->format('Y-m-d 23:59:59');

$stmt = $pdo->prepare("SELECT t.id, t.description, t.amount, t.due_date, t.reminderDays, c.name as categoryName
                        FROM transactions t 
                        LEFT JOIN categories c ON t.categoryId = c.id
                        WHERE t.organizationId = ? AND t.status = 'planned' 
                        AND t.due_date >= ? 
                        AND t.due_date <= DATE_ADD(?, INTERVAL COALESCE(t.reminderDays, ?) DAY)
                        ORDER BY t.due_date ASC");
$nowStr = $actualNow->format('Y-m-d 00:00:00');
$stmt->execute([$organizationId, $nowStr, $nowStr, $reminderDays]);
$upcomingAlerts = $stmt->fetchAll();
foreach ($upcomingAlerts as &$alert) $alert['amount'] = (float)$alert['amount'];

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
        'count' => (int)$allUpcomingBills['count'],
        'total' => (float)$allUpcomingBills['total'],
        'overdueCount' => $overdueCount
    ],
    'upcomingAlerts' => $upcomingAlerts,
    'config' => [
        'reminderDays' => $reminderDays
    ]
]);
?>
