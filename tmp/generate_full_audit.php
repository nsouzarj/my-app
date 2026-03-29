<?php
require 'd:/Projetos/financas/my-app/public/api/db.php';
header('Content-Type: text/plain; charset=utf-8');

$res = [];
$users = $pdo->query("SELECT id, email, fullName FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    $uData = $u;
    $uData['orgs'] = [];
    $stmt = $pdo->prepare("SELECT o.name, o.id FROM organizations o JOIN organization_members om ON o.id = om.organizationId WHERE om.userId = ?");
    $stmt->execute([$u['id']]);
    $orgs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($orgs as $org) {
        $oData = $org;
        $stmtA = $pdo->prepare("SELECT name, id FROM accounts WHERE organizationId = ?");
        $stmtA->execute([$org['id']]);
        $oData['accounts'] = $stmtA->fetchAll(PDO::FETCH_ASSOC);
        $uData['orgs'][] = $oData;
    }
    $res[] = $uData;
}

file_put_contents('d:/Projetos/financas/my-app/tmp/full_audit.json', json_encode($res, JSON_PRETTY_PRINT));
echo "Auditoria completa salva em full_audit.json\n";
?>
