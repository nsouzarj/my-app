<?php
require_once dirname(__DIR__) . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- RESETANDO STATUS DE NOTIFICAÇÕES ---\n\n";

try {
    $sql = "UPDATE transactions SET last_notified_at = NULL WHERE last_notified_at IS NOT NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $rowCount = $stmt->rowCount();
    
    echo "Sucesso! Foram destravadas {$rowCount} conta(s).\n";
    echo "O robô do Cron (notify_planned.php) agora está PRONTO para enviar notificações novamente hoje!\n\n";
    echo "PRÓXIMO PASSO:\n";
    echo "Acesse no seu navegador a URL original do robô para testar a entrega:\n";
    echo "https://nsouza.eti.br/financas/api/cron/notify_planned.php\n";
    
} catch (Exception $e) {
    echo "ERRO AO RESETAR: " . $e->getMessage() . "\n";
}
?>
