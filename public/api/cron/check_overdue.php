<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- BUSCA POR TRANSAÇÕES ATRASADAS --- \n";

$sql = "SELECT id, description, due_date, status, last_notified_at, organizationId 
        FROM transactions 
        WHERE status = 'planned' 
        AND DATE(due_date) < CURDATE()
        ORDER BY due_date ASC";

$stmt = $pdo->query($sql);
$overdue = $stmt->fetchAll();

if (empty($overdue)) {
    echo "Nenhuma transação vencida e não paga encontrada.\n";
} else {
    echo "Encontradas " . count($overdue) . " transações vencidas:\n";
    foreach ($overdue as $t) {
        echo "- ID: {$t['id']} | Desc: {$t['description']} | Venc: {$t['due_date']} | Last Notif: " . ($t['last_notified_at'] ?? 'NUNCA') . "\n";
    }
}

echo "\n--- FIM ---\n";
?>
