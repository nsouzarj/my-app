<?php
require_once 'd:/Projetos/financas/my-app/public/api/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- VERIFICAÇÃO DE TIMESTAMPS DE HOJE (2026-03-28) ---\n";

$sql = "SELECT id, description, last_notified_at 
        FROM transactions 
        WHERE DATE(last_notified_at) = '2026-03-28'";

$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

if (empty($rows)) {
    echo "Nenhuma notificação registrada para hoje até agora.\n";
} else {
    echo "Encontradas " . count($rows) . " notificações hoje:\n";
    foreach ($rows as $r) {
        echo "- ID: {$r['id']} | Desc: {$r['description']} | Em: {$r['last_notified_at']}\n";
    }
}

echo "\n--- FIM ---\n";
?>
