<?php
// public/api/auth/forgot_password.php
require_once __DIR__ . '/../db.php';

$data = getJsonInput();
$email = $data['email'] ?? '';

if (empty($email)) {
    echo json_encode(['error' => 'E-mail é obrigatório']);
    exit;
}

try {
    // 1. Verificar se o usuário existe
    $stmt = $pdo->prepare("SELECT id, fullName, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Por segurança, não confirmamos se o e-mail não existe, 
        // mas dizemos que se existir, as instruções foram enviadas.
        echo json_encode(['success' => true, 'message' => 'Se o e-mail estiver cadastrado, as instruções serão enviadas.']);
        exit;
    }

    // 2. Gerar token único
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // 3. Salvar token no banco
    $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?");
    $stmt->execute([$token, $expiry, $user['id']]);

    // 4. Enviar E-mail
    // Segurança: Hardcoding do domínio oficial para evitar Host Header Injection
    $baseUrl = "https://nsouza.eti.br/financas";
    $resetLink = $baseUrl . "/reset-password?token=" . $token;
    
    $subject = "Recuperação de Senha - Finanças";
    $message = "Olá " . $user['fullName'] . ",\n\n";
    $message .= "Recebemos uma solicitação para redefinir sua senha.\n";
    $message .= "Clique no link abaixo para criar uma nova senha (este link expira em 1 hora):\n\n";
    $message .= $resetLink . "\n\n";
    $message .= "Se você não solicitou esta alteração, ignore este e-mail.\n\n";
    $message .= "Atenciosamente,\nEquipe Finanças";

    require_once __DIR__ . '/mailer.php';
    $mailer = new Mailer();

    try {
        // Usamos o e-mail vindo do banco de dados para segurança máxima
        $mailer->send($user['email'], $subject, $message);
        echo json_encode(['success' => true, 'message' => 'Instruções enviadas com sucesso para o seu e-mail.']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Erro ao enviar e-mail: ' . $e->getMessage()]);
    }

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
