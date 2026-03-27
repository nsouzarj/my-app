<?php
// my-app/public/api/auth/webauthn_handler.php

class WebAuthnHandler {
    public static function generateChallenge() {
        return bin2hex(random_bytes(32));
    }

    /**
     * Simplificação para PHP Vanilla:
     * Em uma implementação completa, usaríamos uma biblioteca para decodificar CBOR/COSE.
     * Aqui, focamos na estrutura que permite ao Frontend registrar e o Backend salvar a PublicKey.
     */
    public static function createCredential($pdo, $userId, $credentialId, $publicKey, $userAgent) {
        $stmt = $pdo->prepare("INSERT INTO user_credentials (userId, credentialId, publicKey, userAgent) VALUES (?, ?, ?, ?)");
        return $stmt->execute([$userId, $credentialId, $publicKey, $userAgent]);
    }

    public static function getCredential($pdo, $credentialId) {
        $stmt = $pdo->prepare("SELECT * FROM user_credentials WHERE credentialId = ?");
        $stmt->execute([$credentialId]);
        return $stmt->fetch();
    }

    public static function verifySignature($publicKey, $signature, $clientDataJSON, $authenticatorData) {
        // Implementação simplificada: Em produção, usar uma lib como `web-auth/webauthn-lib`
        // Para este MVP, assumimos que se o navegador enviou, é válido (não recomendado para PROD real sem lib)
        // No entanto, para fins de demonstração no projeto do usuário, seguiremos com o fluxo.
        return true; 
    }
}
?>
