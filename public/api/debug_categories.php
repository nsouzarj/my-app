<?php
$pdo = new PDO('mysql:host=host4527.hospedameusite.net;dbname=nsouzaet_finandb;charset=utf8', 'nsouzaet_root', '#Nso196840');
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

echo "=== CATEGORIES ===\n";
foreach ($pdo->query("SELECT id, name, type FROM categories") as $r)
    echo "'{$r['name']}' ({$r['type']}) id={$r['id']}\n";

echo "\n=== CATEGORY BREAKDOWN (Expense only, all months) ===\n";
foreach ($pdo->query("SELECT c.name, SUM(t.amount) as total, COUNT(*) as count
                      FROM transactions t JOIN categories c ON t.categoryId = c.id
                      WHERE t.type = 'Expense'
                      GROUP BY c.id, c.name ORDER BY total DESC") as $r)
    echo "'{$r['name']}' | Total: R\${$r['total']} | Transações: {$r['count']}\n";
?>
