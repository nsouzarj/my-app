<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';

$idTeste = '0479b7b2cfdce8943eecebdf65d3c1cf';
$accItauProblem = '4367595d9589777b6a83d1c3b0b4b66f';

$pdo->prepare('UPDATE accounts SET organizationId = ? WHERE id = ?')->execute([$idTeste, $accItauProblem]);
$pdo->prepare('UPDATE transactions SET organizationId = ? WHERE accountId = ?')->execute([$idTeste, $accItauProblem]);

echo "Move final do Itau concluído com sucesso.\n";
?>
