<?php
require_once 'public/api/auth/mailer.php';

try {
    $mailer = new Mailer();
    $to = "nelsonrjbrazil@gmail.com";
    $subject = "💳 Teste de Lembrete - Finanças App";
    
    $message = "Olá Nelson,\n\n";
    $message .= "Este é um teste manual de envio de lembrete do seu novo sistema de Planejamento Financeiro.\n\n";
    $message .= "• Exemplo de Conta: Aluguel de Abril\n";
    $message .= "  Vencimento: 10/04/2026\n";
    $message .= "  Valor: R$ 2.500,00\n\n";
    $message .= "Se você recebeu este e-mail, as notificações automáticas estão funcionando perfeitamente!\n\n";
    $message .= "Atenciosamente,\nEquipe Finanças";
    
    $mailer->send($to, $subject, $message);
    echo "Sucesso: E-mail de teste enviado para $to\n";

} catch (Exception $e) {
    echo "Erro no envio: " . $e->getMessage();
}
?>
