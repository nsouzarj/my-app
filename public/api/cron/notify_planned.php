<?php
// public/api/cron/notify_planned.php
require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/auth/mailer.php';

// Este script deve ser executado via CRON diariamente (ex: 0 8 * * *)
// Ou chamado manualmente para testes: /api/cron/notify_planned.php

header('Content-Type: text/plain');

try {
    $mailer = new Mailer();
    
    // 1. Buscar organizações que ativaram notificações
    $stmtOrgs = $pdo->query("SELECT id, name, reminderDays FROM organizations WHERE emailNotifications = 1");
    $organizations = $stmtOrgs->fetchAll();
    
    echo "Iniciando processamento de notificações de e-mail...\n";
    
    foreach ($organizations as $org) {
        $orgId = $org['id'];
        $defaultDays = (int)$org['reminderDays'];
        
        // 2. Buscar usuários desta organização para enviar o e-mail via organization_members
        $stmtUsers = $pdo->prepare("SELECT u.id, u.email, u.fullName 
                                    FROM users u
                                    JOIN organization_members om ON u.id = om.userId
                                    WHERE om.organizationId = ?");
        $stmtUsers->execute([$orgId]);
        $users = $stmtUsers->fetchAll();
        
        if (empty($users)) continue;

        // 3. Buscar transações planejadas que vencem EXATAMENTE no dia configurado de aviso
        // Queremos avisar APENAS UMA VEZ qdo atingir o prazo.
        // Prazo = DataVencimento - reminderDays
        // Hoje == Prazo?
        
        $sql = "SELECT t.*, c.name as categoryName 
                FROM transactions t
                LEFT JOIN categories c ON t.categoryId = c.id
                WHERE t.organizationId = ? 
                AND t.status = 'planned' 
                AND (t.last_notified_at IS NULL OR DATE(t.last_notified_at) < CURDATE())
                AND DATE(t.due_date) >= CURDATE()
                AND DATE(t.due_date) <= DATE_ADD(CURDATE(), INTERVAL COALESCE(t.reminderDays, ?) DAY)
                ORDER BY t.due_date ASC";
                
        $stmtT = $pdo->prepare($sql);
        $stmtT->execute([$orgId, $defaultDays]);
        $upcoming = $stmtT->fetchAll();
        
        if (empty($upcoming)) {
            echo "Org {$org['name']}: Nenhuma conta atingindo o prazo de aviso hoje.\n";
            continue;
        }

        echo "Org {$org['name']}: Encontrada(s) " . count($upcoming) . " conta(s).\n";

        // 4. Montar e enviar e-mail para cada usuário
        foreach ($users as $user) {
            $to = $user['email'];
            $subject = "💳 Lembrete de Conta Planejada - {$org['name']}";
            
            $message = "Olá {$user['fullName']},\n\n";
            $message .= "Este é um lembrete automático do seu sistema financeiro.\n";
            $message .= "As seguintes contas planejadas estão se aproximando do vencimento:\n\n";
            
            foreach ($upcoming as $tx) {
                $venc = date('d/m/Y', strtotime($tx['due_date']));
                $valor = "R$ " . number_format($tx['amount'], 2, ',', '.');
                $message .= "• {$tx['description']} ({$tx['categoryName']})\n";
                $message .= "  Vencimento: {$venc}\n";
                $message .= "  Valor: {$valor}\n\n";
            }
            
            $message .= "Acesse o painel para confirmar estes pagamentos quando realizados.\n";
            $message .= "https://nsouza.eti.br/financas/planning\n\n";
            $message .= "Atenciosamente,\nEquipe Finanças";
            
            try {
                $mailer->send($to, $subject, $message);
                echo "E-mail enviado para {$to}\n";
            } catch (Exception $e) {
                echo "ERRO ao enviar para {$to}: " . $e->getMessage() . "\n";
            }
            
            // Disparo WebPush
            $stmtPush = $pdo->prepare("SELECT endpoint FROM user_push_subscriptions WHERE userId = ?");
            $stmtPush->execute([$user['id']]);
            $subs = $stmtPush->fetchAll();
            
            if (!empty($subs)) {
                require_once __DIR__ . '/push_lib.php';
                $vapidPublic = 'BBl5tpiuD1iUsMGGskH8CelnsS0_5xYfyPwoo1tMEvZBvorj1NKf0r2e9gVxHE40Nl9Gt3A1qV-d5Th3I7qjfrs';
                $vapidPrivate = 'CYllZK74wn60VZ4sJha8uBE_60enORVIH5KDPzdWjXU';
                $pushSender = new WebPushPuro($vapidPublic, $vapidPrivate);
                
                $payload = [
                    'title' => 'Lembrete de Pagamento 💰',
                    'body' => (count($upcoming) == 1 ? "Conta: " . $upcoming[0]['description'] : "Você tem " . count($upcoming) . " contas para pagar nos próximos dias."),
                    'url' => '/financas/planning'
                ];

                foreach ($subs as $sub) {
                    try {
                        $res = $pushSender->sendNotification($sub['endpoint'], $payload);
                        echo "Push enviado para {$user['id']} (Status: " . $res['status'] . ")\n";
                    } catch (Exception $e) {
                        echo "ERRO Push {$user['id']}: " . $e->getMessage() . "\n";
                    }
                }
            }
        }

        // 5. Marcar estas transações como avisadas hoje para não repetir alarmes (Anti-Spam)
        $upcIds = array_column($upcoming, 'id');
        if (!empty($upcIds)) {
            $placeholders = implode(',', array_fill(0, count($upcIds), '?'));
            $stmtUpd = $pdo->prepare("UPDATE transactions SET last_notified_at = NOW() WHERE id IN ($placeholders)");
            $stmtUpd->execute($upcIds);
            echo "Org {$org['name']}: " . count($upcIds) . " conta(s) marcada(s) como avisadas hoje.\n";
        }
    }
    
    echo "Processamento concluído.\n";

} catch (Exception $e) {
    echo "ERRO CRÍTICO NO CRON: " . $e->getMessage() . "\n";
}
