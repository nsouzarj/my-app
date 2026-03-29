<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- RELATÓRIO FINAL DE STATUS ---\n";

$sql = "SELECT status, count(*) as total FROM transactions GROUP BY status";
$stmt = $pdo->query($sql);
$counts = $stmt->fetchAll();

foreach ($counts as $c) {
    echo "Status: '{$c['status']}' | Total: {$c['total']}\n";
}

echo "\n--- TRANSAÇÕES NÃO PAGAS (PENDING/PLANNED) ---\n";
$sql2 = "SELECT id, description, due_date, status, organizationId FROM transactions WHERE status IN ('pending', 'planned') ORDER BY due_date ASC";
$stmt2 = $pdo->query($sql2);
$txs = $stmt2->fetchAll();

foreach ($txs as $t) {
    echo "- ID: {$t['id']} | Status: {$t['status']} | Venc: {$t['due_date']} | Desc: {$t['description']}\n";
}

echo "\n--- FIM ---\n";
?>
