<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';

$idTeste = '0479b7b2cfdce8943eecebdf65d3c1cf';
$accItauProblem = '4367595d9589777b6a83d1c3b0b4b66f';

echo "Estado inicial da conta:\n";
$stmt1 = $pdo->prepare("SELECT organizationId FROM accounts WHERE id = ?");
$stmt1->execute([$accItauProblem]);
echo "Org anterior: " . $stmt1->fetchColumn() . "\n";

$pdo->prepare('UPDATE accounts SET organizationId = ? WHERE id = ?')->execute([$idTeste, $accItauProblem]);
$pdo->prepare('UPDATE transactions SET organizationId = ? WHERE accountId = ?')->execute([$idTeste, $accItauProblem]);

echo "Estado após update:\n";
$stmt2 = $pdo->prepare("SELECT organizationId FROM accounts WHERE id = ?");
$stmt2->execute([$accItauProblem]);
echo "Nova Org: " . $stmt2->fetchColumn() . "\n";
?>
