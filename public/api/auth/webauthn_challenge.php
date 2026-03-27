<?php
// my-app/public/api/auth/webauthn_challenge.php
require_once '../db.php';
require_once 'webauthn_handler.php';

session_start();

$challenge = WebAuthnHandler::generateChallenge();
$_SESSION['webauthn_challenge'] = $challenge;

echo json_encode([
    'success' => true,
    'challenge' => $challenge,
    'rp' => [
        'name' => 'Finanças App',
        'id' => $_SERVER['HTTP_HOST']
    ],
    'user' => [
        'id' => $_SESSION['user_id'] ?? 'guest',
        'name' => $_SESSION['user_email'] ?? 'guest@example.com',
        'displayName' => $_SESSION['user_name'] ?? 'Usuário'
    ]
]);
?>
