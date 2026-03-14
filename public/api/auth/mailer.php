<?php
// public/api/auth/mailer.php

class Mailer {
    private $host = "mail.nsouza.eti.br";
    private $port = 587;
    private $user = "financas@nsouza.eti.br";
    private $pass = "#Nso196840";
    private $fromEmail = "financas@nsouza.eti.br";
    private $fromName = "Equipe Finanças";

    public function send($to, $subject, $message) {
        $socket = fsockopen($this->host, $this->port, $errno, $errstr, 15);
        if (!$socket) {
            throw new Exception("Falha ao conectar ao servidor SMTP: $errstr");
        }

        $this->getResponse($socket); // 220

        $this->sendCommand($socket, "EHLO " . gethostname());
        
        // STARTTLS
        $this->sendCommand($socket, "STARTTLS");
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $this->sendCommand($socket, "EHLO " . gethostname());

        // AUTH
        $this->sendCommand($socket, "AUTH LOGIN");
        $this->sendCommand($socket, base64_encode($this->user));
        $this->sendCommand($socket, base64_encode($this->pass));

        // MAIL FROM
        $this->sendCommand($socket, "MAIL FROM: <{$this->fromEmail}>");

        // RCPT TO
        $this->sendCommand($socket, "RCPT TO: <$to>");

        // DATA
        $this->sendCommand($socket, "DATA");

        // Create headers
        $headers = [
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=utf-8",
            "From: \"{$this->fromName}\" <{$this->fromEmail}>",
            "To: <$to>",
            "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
            "Date: " . date("r"),
            "X-Mailer: PHP-SMTP-Custom"
        ];

        $content = implode("\r\n", $headers) . "\r\n\r\n" . $message . "\r\n.\r\n";
        fwrite($socket, $content);
        $this->getResponse($socket);

        // QUIT
        $this->sendCommand($socket, "QUIT");
        fclose($socket);

        return true;
    }

    private function sendCommand($socket, $command) {
        fwrite($socket, $command . "\r\n");
        return $this->getResponse($socket);
    }

    private function getResponse($socket) {
        $response = "";
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) == " ") break;
        }
        return $response;
    }
}
?>
