<?php
// public/api/auth/smtp_tester.php
require_once __DIR__ . '/../db.php';

$smtpHost = "mail.nsouza.eti.br";
$smtpPort = 587;
$smtpUser = "financas@nsouza.eti.br";
$smtpPass = "#Nso196840";

function smtp_response($socket) {
    $response = "";
    while ($line = fgets($socket, 512)) {
        $response .= $line;
        if (substr($line, 3, 1) == " ") break;
    }
    return $response;
}

echo "Iniciando teste SMTP...\n";

$socket = fsockopen($smtpHost, $smtpPort, $errno, $errstr, 10);
if (!$socket) {
    die("Falha ao abrir socket: $errstr ($errno)\n");
}

echo "Conectado. Resposta do servidor: " . smtp_response($socket);

fwrite($socket, "EHLO " . gethostname() . "\r\n");
echo "EHLO: " . smtp_response($socket);

// Tenta STARTTLS se disponível
fwrite($socket, "STARTTLS\r\n");
$response = smtp_response($socket);
echo "STARTTLS: " . $response;

if (strpos($response, '220') !== false) {
    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
    fwrite($socket, "EHLO " . gethostname() . "\r\n");
    echo "EHLO (After TLS): " . smtp_response($socket);
}

fwrite($socket, "AUTH LOGIN\r\n");
echo "AUTH LOGIN: " . smtp_response($socket);

fwrite($socket, base64_encode($smtpUser) . "\r\n");
echo "User: " . smtp_response($socket);

fwrite($socket, base64_encode($smtpPass) . "\r\n");
echo "Pass: " . smtp_response($socket);

fwrite($socket, "QUIT\r\n");
fclose($socket);

echo "\nTeste concluído.\n";
?>
