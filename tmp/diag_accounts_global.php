<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$email = 'nsouzarj@outlook.com';

// 1. Pegar as empresas que Nelson é membro
$sql = "SELECT o.id, o.name 
        FROM organizations o 
        JOIN organization_members om ON o.id = om.organizationId
        JOIN users u ON om.userId = u.id
        WHERE u.email = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$email]);
$orgs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- RELATÓRIO DE CONTAS POR EMPRESA (NELSON) ---\n\n";

if (empty($orgs)) {
    echo "Nenhuma empresa vinculada encontrada.\n";
}

foreach ($orgs as $org) {
    echo "EMPRESA: {$org['name']} (ID: {$org['id']})\n";
    
    $stmtA = $pdo->prepare("SELECT name, id FROM accounts WHERE organizationId = ?");
    $stmtA->execute([$org['id']]);
    $accounts = $stmtA->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($accounts)) {
        echo "  - Sem contas cadastradas.\n";
    } else {
        foreach ($accounts as $acc) {
            echo "  - [CONT] {$acc['name']} (ID: {$acc['id']})\n";
        }
    }
    echo "--------------------------------------------------\n";
}

// 2. Procurar por TODAS as contas no sistema que TALVEZ nelson devesse ver mas não está vinculado
echo "\n--- BUSCA GLOBAL DE CONTAS (CONVERSE CHECK) ---\n";
$stmtG = $pdo->query("SELECT a.name, a.organizationId, o.name as orgName FROM accounts a LEFT JOIN organizations o ON a.organizationId = o.id");
$allGlobal = $stmtG->fetchAll(PDO::FETCH_ASSOC);
foreach($allGlobal as $g) {
    echo "Conta: {$g['name']} | Pertence à Org: [{$g['orgName']}]\n";
}
?>
