<?php
require_once dirname(__DIR__) . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- INÍCIO DO DIAGNÓSTICO DO ROBÔ ---\n\n";

$orgs = $pdo->query("SELECT id, name, reminderDays FROM organizations WHERE emailNotifications = 1")->fetchAll();

foreach ($orgs as $org) {
    echo "====================================\n";
    echo "Organização: {$org['name']}\n";
    echo "Antecedência configurada na empresa (reminderDays): " . (int)$org['reminderDays'] . " dias\n\n";

    echo "Listando TODAS as contas Planejadas desta empresa...\n";
    $stmt = $pdo->prepare("SELECT id, description, due_date, status, reminderDays, last_notified_at FROM transactions WHERE organizationId = ? AND status = 'planned'");
    $stmt->execute([$org['id']]);
    $todas = $stmt->fetchAll();

    if (empty($todas)) {
        echo "> Nenhuma conta planejada existe nesta empresa.\n\n";
        continue;
    }

    foreach ($todas as $t) {
        $vencimento = date('Y-m-d', strtotime($t['due_date']));
        $hoje = date('Y-m-d');
        
        $diff = (strtotime($vencimento) - strtotime($hoje)) / (60*60*24);
        
        // Quantos dias essa conta usa de antecedência? A própria conta ou a da empresa?
        $antecedencia = $t['reminderDays'] ? (int)$t['reminderDays'] : (int)$org['reminderDays'];

        echo "Conta: {$t['description']} | Vence em: {$vencimento} ({$diff} dias a partir de hoje)\n";
        echo " - A antecedência desta conta é de: {$antecedencia} dias\n";
        
        if ($t['last_notified_at']) {
            echo " - ⚠️ AVISO: Esta conta já foi notificada hoje! (last_notified_at: {$t['last_notified_at']})\n";
        }

        if ($diff < 0) {
            echo " - 🔴 STATUS: Atrasada (Vencida). Não entra na janela de próximos avisos.\n";
        } elseif ($diff <= $antecedencia) {
            echo " - 🟢 STATUS: DENTRO da janela! O Cron DEVERIA pegar essa conta.\n";
        } else {
            echo " - 🟡 STATUS: FORA da janela. Ela vence daqui a {$diff} dias, mas o aviso só começa {$antecedencia} dias antes.\n";
        }
        echo "---------------------------------\n";
    }
}
echo "\n--- FIM DO DIAGNÓSTICO ---\n";
?>
