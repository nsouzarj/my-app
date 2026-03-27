<?php
// my-app/public/api/auth/save_push.php
require_once '../db.php';

$data = getJsonInput();

if (empty($data['userId']) || empty($data['endpoint'])) {
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

try {
    $userId = $data['userId'];
    $endpoint = $data['endpoint'];
    $p256dh = $data['keys']['p256dh'] ?? '';
    $auth = $data['keys']['auth'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

    // Verifica se já existe esse endpoint para o mesmo usuário
    $stmt = $pdo->prepare("SELECT id FROM user_push_subscriptions WHERE userId = ? AND endpoint = ?");
    $stmt->execute([$userId, $endpoint]);
    $exists = $stmt->fetch();

    if (!$exists) {
        $stmt = $pdo->prepare("INSERT INTO user_push_subscriptions (userId, endpoint, p256dh, auth, userAgent) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $endpoint, $p256dh, $auth, $userAgent]);
    } else {
        $stmt = $pdo->prepare("UPDATE user_push_subscriptions SET updatedAt = NOW() WHERE id = ?");
        $stmt->execute([$exists['id']]);
    }

    echo json_encode(['success' => true, 'message' => 'Inscrição salva com sucesso']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
