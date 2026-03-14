<?php
// public/api/auth/test_mailer_class.php
require_once __DIR__ . '/mailer.php';

$to = "financas@nsouza.eti.br";
$subject = "Teste de Classe Mailer - Finanças";
$message = "Este é um teste usando a nova classe Mailer com SMTP direto.";

echo "Iniciando envio via Mailer...\n";
$mailer = new Mailer();

try {
    if ($mailer->send($to, $subject, $message)) {
        echo "Sucesso! E-mail enviado.\n";
    }
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
