<?php
require_once dirname(__DIR__) . '/db.php';

echo "--- VERIFICAÇÃO DE DISPAROS RECENTES ---\n\n";

$sql = "SELECT id, description, last_notified_at, due_date 
        FROM transactions 
        WHERE status = 'planned' 
        AND due_date >= CURDATE()
        ORDER BY last_notified_at DESC";

$stmt = $pdo->query($sql);
$results = $stmt->fetchAll();

if (empty($results)) {
    echo "Nenhuma transação planejada encontrada.\n";
} else {
    foreach ($results as $r) {
        echo "ID: {$r['id']} | Desc: {$r['description']} | Último Disparo: " . ($r['last_notified_at'] ?? 'NUNCA') . " | Vencimento: {$r['due_date']}\n";
    }
}
echo "\n--- FIM ---";
