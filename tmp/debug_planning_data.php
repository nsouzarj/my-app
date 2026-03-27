<?php
require_once 'public/api/db.php';

try {
    $stmt = $pdo->query("SELECT id, description, amount, type, status FROM transactions WHERE status = 'planned' LIMIT 5");
    $txs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "TRANSAÇÕES PLANEJADAS NO BANCO:\n";
    print_r($txs);
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
