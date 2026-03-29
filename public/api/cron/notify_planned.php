<?php
// public/api/cron/notify_planned.php
require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/auth/mailer.php';

// Este script deve ser executado via CRON (ex: 0 9,15,19 * * *)
// Agora configurado para enviar 3 vezes ao dia conforme solicitado.

header('Content-Type: text/plain');

try {
    $mailer = new Mailer();
    
    // 1. Buscar organizações (processar todas para garantir WebPush mesmo sem e-mail)
    $stmtOrgs = $pdo->query("SELECT id, name, reminderDays, emailNotifications FROM organizations");
    $organizations = $stmtOrgs->fetchAll();
    
    echo "Iniciando processamento de notificações triplas...\n";
    
    foreach ($organizations as $org) {
        $orgId = $org['id'];
        $defaultDays = (int)$org['reminderDays'];
        
        // 2. Buscar usuários desta organização
        $stmtUsers = $pdo->prepare("SELECT u.id, u.email, u.fullName, u.reminderDays 
                                    FROM users u
                                    JOIN organization_members om ON u.id = om.userId
                                    WHERE om.organizationId = ?");
        $stmtUsers->execute([$orgId]);
        $users = $stmtUsers->fetchAll();
        
        if (empty($users)) {
            echo "Org {$org['name']}: Ignorada (Nenhum usuário vinculado para receber notificações).\n";
            continue;
        }

        // 3. Processar cada usuário com sua própria preferência de prazo
        foreach ($users as $user) {
            $to = $user['email'];
            $userDays = (int)($user['reminderDays'] ?? $defaultDays);
            
            // Buscar transações baseadas na preferência DESTE usuário
            $sql = "SELECT t.*, c.name as categoryName 
                    FROM transactions t
                    LEFT JOIN categories c ON t.categoryId = c.id
                    WHERE t.organizationId = ? 
                    AND t.status IN ('planned', 'pending') 
                    AND DATE(t.due_date) <= DATE_ADD(CURDATE(), INTERVAL COALESCE(t.reminderDays, ?) DAY)
                    ORDER BY t.due_date ASC";
                    
            $stmtT = $pdo->prepare($sql);
            $stmtT->execute([$orgId, $userDays]);
            $upcoming = $stmtT->fetchAll();

            if (empty($upcoming)) {
                echo "Org {$org['name']} / User {$user['id']}: Nenhuma conta no prazo de aviso ({$userDays} dias).\n";
                continue;
            }

            echo "Org {$org['name']} / User {$user['id']}: Encontrada(s) " . count($upcoming) . " conta(s) (Prazo: {$userDays} dias).\n";

            $subject = "💳 Lembrete de Conta Planejada - {$org['name']}";
            
            // Montar mensagem
            $msg = "Olá {$user['fullName']},\n\n";
            $msg .= "Este é um lembrete automático do seu sistema financeiro.\n";
            $msg .= "As seguintes contas planejadas estão se aproximando do vencimento:\n\n";
            
            foreach ($upcoming as $tx) {
                $venc = date('d/m/Y', strtotime($tx['due_date']));
                $valor = "R$ " . number_format($tx['amount'], 2, ',', '.');
                $isOverdue = (strtotime($tx['due_date']) < strtotime(date('Y-m-d')));
                $prefix = $isOverdue ? "⚠️ ATRASADA: " : "• ";
                
                $msg .= "{$prefix}{$tx['description']} (" . ($tx['categoryName'] ?? 'Geral') . ")\n";
                $msg .= "  Vencimento: {$venc}\n";
                $msg .= "  Valor: {$valor}\n\n";
            }
            
            $msg .= "Acesse o painel para confirmar estes pagamentos.\n";
            $msg .= "https://nsouza.eti.br/financas/planning\n\n";
            $msg .= "Atenciosamente,\nEquipe Finanças";

            // A. Enviar e-mail apenas se habilitado
            if ((int)$org['emailNotifications'] === 1) {
                try {
                    $mailer->send($to, $subject, $msg);
                    echo "E-mail enviado para {$to}\n";
                } catch (Exception $e) {
                    echo "ERRO ao enviar para {$to}: " . $e->getMessage() . "\n";
                }
            } else {
                echo "E-mail ignorado para {$to} (Desativado na Org).\n";
            }
            
            // B. Enviar WebPush sempre que houver inscrição
            $stmtPush = $pdo->prepare("SELECT endpoint FROM user_push_subscriptions WHERE userId = ?");
            $stmtPush->execute([$user['id']]);
            $subs = $stmtPush->fetchAll();
            
            if (!empty($subs)) {
                require_once __DIR__ . '/push_lib.php';
                $vapidPublic = 'BBl5tpiuD1iUsMGGskH8CelnsS0_5xYfyPwoo1tMEvZBvorj1NKf0r2e9gVxHE40Nl9Gt3A1qV-d5Th3I7qjfrs';
                $vapidPrivate = 'CYllZK74wn60VZ4sJha8uBE_60enORVIH5KDPzdWjXU';
                $pushSender = new WebPushPuro($vapidPublic, $vapidPrivate);
                
                $pushTitle = "Lembrete: " . $org['name'] . " 💰";
                $count = count($upcoming);
                
                if ($count === 1) {
                    $pushBody = "Conta: " . $upcoming[0]['description'];
                } else {
                    $descriptions = array_slice(array_column($upcoming, 'description'), 0, 2);
                    $pushBody = "Você tem $count contas: " . implode(', ', $descriptions) . "...";
                }

                $payload = [
                    'title' => $pushTitle,
                    'body' => $pushBody,
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

            // 4. Atualizar last_notified_at para auditoria
            $upcIds = array_column($upcoming, 'id');
            if (!empty($upcIds)) {
                $placeholders = implode(',', array_fill(0, count($upcIds), '?'));
                $stmtUpd = $pdo->prepare("UPDATE transactions SET last_notified_at = NOW() WHERE id IN ($placeholders)");
                $stmtUpd->execute($upcIds);
            }
        }
    }
    
    echo "Processamento concluído.\n";

} catch (Exception $e) {
    echo "ERRO CRÍTICO NO CRON: " . $e->getMessage() . "\n";
}
