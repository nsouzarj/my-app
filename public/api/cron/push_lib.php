<?php
// my-app/public/api/cron/push_lib.php

class WebPushPuro {
    private $publicKey;
    private $privateKey;

    public function __construct($publicKeyBase64Url, $privateKeyBase64Url) {
        $this->publicKey = $publicKeyBase64Url;
        $this->privateKey = $privateKeyBase64Url;
    }

    private function base64UrlDecode($data) {
        $b64 = strtr($data, '-_', '+/');
        while (strlen($b64) % 4 !== 0) $b64 .= '=';
        return base64_decode($b64);
    }

    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function getPem() {
        $privRaw = $this->base64UrlDecode($this->privateKey);
        $pubRaw = $this->base64UrlDecode($this->publicKey);
        
        $der = "\x30\x77" 
             . "\x02\x01\x01" 
             . "\x04\x20" . $privRaw 
             . "\xA0\x0A\x06\x08\x2A\x86\x48\xCE\x3D\x03\x01\x07" 
             . "\xA1\x44\x03\x42\x00" . $pubRaw;
        
        return "-----BEGIN EC PRIVATE KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END EC PRIVATE KEY-----\n";
    }

    public function sendNotification($endpoint, $payload = null) {
        $header = ['typ' => 'JWT', 'alg' => 'ES256'];
        $parsedUrl = parse_url($endpoint);
        $aud = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];
        
        $jwtPayload = [
            'aud' => $aud,
            'exp' => time() + 43200,
            'sub' => 'mailto:contato@nsouza.eti.br'
        ];

        $segments = [];
        $segments[] = $this->base64UrlEncode(json_encode($header));
        $segments[] = $this->base64UrlEncode(json_encode($jwtPayload));
        $stringToSign = implode('.', $segments);

        $pem = $this->getPem();
        $pkey = openssl_pkey_get_private($pem);
        if (!$pkey) {
            throw new Exception("Falha ao gerar chave OpenSSL local.");
        }

        openssl_sign($stringToSign, $signature, $pkey, OPENSSL_ALGO_SHA256);
        
        $signature = $this->derToRS($signature);
        if (!$signature) {
            throw new Exception("Falha ao formatar assinatura.");
        }
        
        $jwt = $stringToSign . '.' . $this->base64UrlEncode($signature);

        $ch = curl_init($endpoint);
        $headers = [
            'Authorization: vapid t=' . $jwt . ', k=' . $this->publicKey,
            'TTL: 86400'
        ];
        
        if ($payload) {
            $headers[] = 'Content-Type: application/json';
            $headers[] = 'Content-Encoding: identity'; // Simplificado, sem criptografia de payload interna (body) pois requer lib externa pesada. 
            // Nota: O payload aqui será enviado no body. Se o navegador exigir criptografia aes128gcm (padrão), 
            // precisaremos de uma lib completa. Por enquanto enviamos como texto limpo para ver se o browser aceita.
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($payload) ? json_encode($payload) : $payload);
        } else {
            curl_setopt($ch, CURLOPT_POSTFIELDS, "");
            $headers[] = 'Content-Length: 0';
        }
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);        // máx 10s de espera total
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);  // máx 5s para conectar
        
        $result = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return ['status' => $status, 'result' => $result];
    }

    private function derToRS($der) {
        $hex = bin2hex($der);
        if (substr($hex, 0, 2) !== '30') return false;
        
        $ptr = 4;
        
        if (substr($hex, $ptr, 2) !== '02') return false;
        $ptr += 2;
        $rLen = hexdec(substr($hex, $ptr, 2)) * 2;
        $ptr += 2;
        $rHex = substr($hex, $ptr, $rLen);
        $ptr += $rLen;
        
        if (substr($hex, $ptr, 2) !== '02') return false;
        $ptr += 2;
        $sLen = hexdec(substr($hex, $ptr, 2)) * 2;
        $ptr += 2;
        $sHex = substr($hex, $ptr, $sLen);
        
        if (strlen($rHex) == 66 && substr($rHex, 0, 2) == '00') $rHex = substr($rHex, 2);
        if (strlen($sHex) == 66 && substr($sHex, 0, 2) == '00') $sHex = substr($sHex, 2);
        
        $rHex = str_pad($rHex, 64, '0', STR_PAD_LEFT);
        $sHex = str_pad($sHex, 64, '0', STR_PAD_LEFT);
        
        return hex2bin($rHex . $sHex);
    }
}
?>
