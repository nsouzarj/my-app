<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- VERIFICAÇÃO DE STATUS DE NOTIFICAÇÃO ---\n";
echo "Data/Hora Atual: " . date('Y-m-d H:i:s') . "\n\n";

$sql = "SELECT id, description, due_date, status, last_notified_at, organizationId 
        FROM transactions 
        WHERE status = 'planned' 
        AND DATE(due_date) >= CURDATE()
        ORDER BY due_date ASC";

$stmt = $pdo->query($sql);
$transactions = $stmt->fetchAll();

if (empty($transactions)) {
    echo "Nenhuma transação planejada encontrada para hoje ou futuro.\n";
} else {
    foreach ($transactions as $t) {
        echo "ID: {$t['id']} | Desc: {$t['description']} | Venc: {$t['due_date']} | Last Notif: " . ($t['last_notified_at'] ?? 'NUNCA') . " | Org: {$t['organizationId']}\n";
    }
}

echo "\n--- FIM ---\n";
?>
