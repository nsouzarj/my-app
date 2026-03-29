<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';

// 1. Identificar IDs
$stmt = $pdo->query("SELECT id, name FROM organizations");
$orgs = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

$idFinPessoais = array_search('Finanças Pessoais', $orgs);
$idDemostracao = array_search('DEMOSTRAÇÃO', $orgs);
$idTeste       = array_search('teste', $orgs);

echo "IDs identificados:\n";
echo "FinPessoais: $idFinPessoais\n";
echo "Demostracao: $idDemostracao\n";
echo "Teste:       $idTeste\n\n";

if (!$idFinPessoais) {
    echo "ERRO: Org 'Finanças Pessoais' não encontrada.\n";
    exit;
}

// 2. Mover Contas (Accounts)
if ($idDemostracao) {
    $stmtA = $pdo->prepare("UPDATE accounts SET organizationId = ? WHERE organizationId = ?");
    $stmtA->execute([$idFinPessoais, $idDemostracao]);
    echo "Contas movidas de DEMOSTRAÇÃO: " . $stmtA->rowCount() . "\n";
    
    $stmtT = $pdo->prepare("UPDATE transactions SET organizationId = ? WHERE organizationId = ?");
    $stmtT->execute([$idFinPessoais, $idDemostracao]);
    echo "Transações movidas de DEMOSTRAÇÃO: " . $stmtT->rowCount() . "\n";
}

if ($idTeste) {
    $stmtA = $pdo->prepare("UPDATE accounts SET organizationId = ? WHERE organizationId = ?");
    $stmtA->execute([$idFinPessoais, $idTeste]);
    echo "Contas movidas de teste: " . $stmtA->rowCount() . "\n";
    
    $stmtT = $pdo->prepare("UPDATE transactions SET organizationId = ? WHERE organizationId = ?");
    $stmtT->execute([$idFinPessoais, $idTeste]);
    echo "Transações movidas de teste: " . $stmtT->rowCount() . "\n";
}

// 3. Remover Nelson das Orgs extras
$stmtU = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmtU->execute([$email]);
$userId = $stmtU->fetchColumn();

if ($userId) {
    $toDelete = array_filter([$idDemostracao, $idTeste]);
    if (!empty($toDelete)) {
        $placeholders = implode(',', array_fill(0, count($toDelete), '?'));
        $stmtDel = $pdo->prepare("DELETE FROM organization_members WHERE userId = ? AND organizationId IN ($placeholders)");
        $stmtDel->execute(array_merge([$userId], array_values($toDelete)));
        echo "Membros removidos das Orgs extras: " . $stmtDel->rowCount() . "\n";
    }
}

echo "\n--- CONSOLIDAÇÃO CONCLUÍDA ---\n";
?>
