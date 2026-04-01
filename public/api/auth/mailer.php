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
        $socket = fsockopen($this->host, $this->port, $errno, $errstr, 5); // 5s para conectar
        if (!$socket) {
            throw new Exception("Falha ao conectar ao servidor SMTP: $errstr");
        }

        // Timeout de leitura/escrita: 20s (Outlook pode ser mais lento)
        stream_set_timeout($socket, 20);

        try {
            $this->getAndCheckResponse($socket, ['220']);

            $this->sendCommand($socket, "EHLO " . gethostname(), ['250']);
            
            // STARTTLS
            $this->sendCommand($socket, "STARTTLS", ['220']);
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $this->sendCommand($socket, "EHLO " . gethostname(), ['250']);

            // AUTH
            $this->sendCommand($socket, "AUTH LOGIN", ['334']);
            $this->sendCommand($socket, base64_encode($this->user), ['334']);
            $this->sendCommand($socket, base64_encode($this->pass), ['235']);

            // MAIL FROM
            $this->sendCommand($socket, "MAIL FROM: <{$this->fromEmail}>", ['250']);

            // RCPT TO
            $this->sendCommand($socket, "RCPT TO: <$to>", ['250', '251']);

            // DATA
            $this->sendCommand($socket, "DATA", ['354']);

            // Normalize message newlines to \r\n and avoid '.' on a single line problem
            $message = str_replace(["\r\n", "\r", "\n"], "\r\n", $message);
            $message = preg_replace("/^\./m", "..", $message);

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
            $this->getAndCheckResponse($socket, ['250']);

            // QUIT
            $this->sendCommand($socket, "QUIT", ['221']);
            fclose($socket);

            return true;

        } catch (Exception $e) {
            // Tenta fechar a conexão limpa antes de propagar o erro
            @fwrite($socket, "QUIT\r\n");
            @fclose($socket);
            throw $e;
        }
    }


    private function sendCommand($socket, $command, $expectedCodes = []) {
        fwrite($socket, $command . "\r\n");
        return $this->getAndCheckResponse($socket, $expectedCodes);
    }

    private function getAndCheckResponse($socket, $expectedCodes = []) {
        $response = "";
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) == " ") break;
        }

        if (!empty($expectedCodes)) {
            $code = substr($response, 0, 3);
            if (!in_array($code, $expectedCodes)) {
                throw new Exception("SMTP Error: Expected " . implode('/', $expectedCodes) . " but got $response");
            }
        }

        return $response;
    }
}
?>
