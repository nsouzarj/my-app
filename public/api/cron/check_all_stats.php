<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- CONTAGEM GERAL DE TRANSAÇÕES POR STATUS ---\n";

$sql = "SELECT status, count(*) as total FROM transactions GROUP BY status";
$stmt = $pdo->query($sql);
$counts = $stmt->fetchAll();

foreach ($counts as $c) {
    echo "Status: {$c['status']} | Total: {$c['total']}\n";
}

echo "\n--- ÚLTIMAS 5 TRANSAÇÕES CRIADAS ---\n";
$sql2 = "SELECT id, description, due_date, status, createdAt FROM transactions ORDER BY createdAt DESC LIMIT 5";
$stmt2 = $pdo->query($sql2);
$recent = $stmt2->fetchAll();

foreach ($recent as $r) {
    echo "- ID: {$r['id']} | Desc: {$r['description']} | Venc: {$r['due_date']} | Status: {$r['status']} | Criado em: {$r['createdAt']}\n";
}

echo "\n--- FIM ---\n";
?>
