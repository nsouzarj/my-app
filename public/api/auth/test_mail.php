<?php
// public/api/auth/test_mail.php
require_once __DIR__ . '/../db.php';

$to = "financas@nsouza.eti.br";
$subject = "Teste de E-mail - Finanças";
$message = "Este é um teste de envio de e-mail do sistema de finanças.";
$headers = "From: financas@nsouza.eti.br\r\n";
$headers .= "Reply-To: financas@nsouza.eti.br\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Tentando enviar e-mail para $to...\n";
if (mail($to, $subject, $message, $headers)) {
    echo "E-mail enviado com sucesso (via mail()).\n";
} else {
    echo "Falha ao enviar e-mail (via mail()).\n";
}
?>
