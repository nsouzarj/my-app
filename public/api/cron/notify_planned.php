<?php
// public/api/cron/notify_planned.php
require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/auth/mailer.php';

// Este script deve ser executado via CRON (ex: 0 9,15,19 * * *)
set_time_limit(300);       // 5 minutos — evita timeout no servidor
ini_set('memory_limit', '128M');
header('Content-Type: text/plain');

$executionStart = date('Y-m-d H:i:s');
echo "=== CRON INICIADO em {$executionStart} ===\n";

try {
    $mailer = new Mailer();
    
    // 1. Buscar organizações (processar todas para garantir WebPush mesmo sem e-mail)
    $stmtOrgs = $pdo->query("SELECT id, name, reminderDays, emailNotifications FROM organizations");
    $organizations = $stmtOrgs->fetchAll();
    
    echo "Total de organizações encontradas: " . count($organizations) . "\n\n";
    
    foreach ($organizations as $org) {
        $orgId   = $org['id'];
        $orgName = $org['name'];
        $defaultDays = (int)($org['reminderDays'] ?? 7);
        
        echo "--- Processando Org: [{$orgName}] (ID: {$orgId}) ---\n";
        echo "    EmailNotifications: " . ($org['emailNotifications'] ? 'habilitado' : 'desabilitado') . " | Padrão de dias: {$defaultDays}\n";

        try {
            // 2. Buscar usuários desta organização
            $stmtUsers = $pdo->prepare(
                "SELECT u.id, u.email, u.fullName, u.reminderDays 
                 FROM users u
                 JOIN organization_members om ON u.id = om.userId
                 WHERE om.organizationId = ?"
            );
            $stmtUsers->execute([$orgId]);
            $users = $stmtUsers->fetchAll();
            
            if (empty($users)) {
                echo "    SKIP: Nenhum usuário vinculado.\n\n";
                continue;
            }

            echo "    Usuários encontrados: " . count($users) . "\n";

            // 3. Processar cada usuário com sua própria preferência de prazo
            foreach ($users as $user) {
                $to       = $user['email'];
                $userDays = ($user['reminderDays'] !== null) ? (int)$user['reminderDays'] : $defaultDays;

                echo "    > Usuário: {$user['fullName']} <{$to}> | Prazo efetivo: {$userDays} dias\n";

                try {
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
                        echo "      Sem contas no prazo de {$userDays} dias. Pulando.\n";
                        continue;
                    }

                    echo "      Contas encontradas: " . count($upcoming) . "\n";

                    $subject = "💳 Lembrete de Conta Planejada - {$orgName}";
                    
                    // Montar mensagem
                    $msg  = "Olá {$user['fullName']},\n\n";
                    $msg .= "Este é um lembrete automático do seu sistema financeiro.\n";
                    $msg .= "As seguintes contas planejadas estão se aproximando do vencimento:\n\n";
                    
                    foreach ($upcoming as $tx) {
                        $venc      = date('d/m/Y', strtotime($tx['due_date']));
                        $valor     = "R$ " . number_format($tx['amount'], 2, ',', '.');
                        $isOverdue = (strtotime($tx['due_date']) < strtotime(date('Y-m-d')));
                        $prefix    = $isOverdue ? "⚠️ ATRASADA: " : "• ";
                        
                        $msg .= "{$prefix}{$tx['description']} (" . ($tx['categoryName'] ?? 'Geral') . ")\n";
                        $msg .= "  Vencimento: {$venc}\n";
                        $msg .= "  Valor: {$valor}\n\n";
                    }
                    
                    $msg .= "Acesse o painel para confirmar estes pagamentos.\n";
                    $msg .= "https://nsouza.eti.br/financas/planning\n\n";
                    $msg .= "Atenciosamente,\nEquipe Finanças";

                    // A. Enviar e-mail (se habilitado na organização)
                    if ((int)$org['emailNotifications'] === 1) {
                        try {
                            $mailer->send($to, $subject, $msg);
                            echo "      ✅ E-mail enviado para: {$to}\n";
                        } catch (Exception $e) {
                            echo "      ❌ ERRO ao enviar e-mail para {$to}: " . $e->getMessage() . "\n";
                        }
                    } else {
                        echo "      E-mail ignorado para {$to} (desabilitado na org).\n";
                    }
                    
                    // B. Enviar WebPush sempre que houver inscrição
                    $stmtPush = $pdo->prepare("SELECT endpoint FROM user_push_subscriptions WHERE userId = ?");
                    $stmtPush->execute([$user['id']]);
                    $subs = $stmtPush->fetchAll();
                    
                    if (!empty($subs)) {
                        require_once __DIR__ . '/push_lib.php';
                        $vapidPublic  = 'BBl5tpiuD1iUsMGGskH8CelnsS0_5xYfyPwoo1tMEvZBvorj1NKf0r2e9gVxHE40Nl9Gt3A1qV-d5Th3I7qjfrs';
                        $vapidPrivate = 'CYllZK74wn60VZ4sJha8uBE_60enORVIH5KDPzdWjXU';
                        $pushSender   = new WebPushPuro($vapidPublic, $vapidPrivate);
                        
                        $pushTitle = "Lembrete: {$orgName} 💰";
                        $count     = count($upcoming);
                        
                        if ($count === 1) {
                            $pushBody = "Conta: " . $upcoming[0]['description'];
                        } else {
                            $descriptions = array_slice(array_column($upcoming, 'description'), 0, 2);
                            $pushBody     = "Você tem {$count} contas: " . implode(', ', $descriptions) . "...";
                        }

                        $payload = [
                            'title' => $pushTitle,
                            'body'  => $pushBody,
                            'url'   => '/financas/planning'
                        ];

                        foreach ($subs as $sub) {
                            try {
                                $res = $pushSender->sendNotification($sub['endpoint'], $payload);
                                echo "      ✅ Push enviado para {$to} (Status: " . $res['status'] . ")\n";
                            } catch (Exception $e) {
                                echo "      ❌ ERRO Push para {$to}: " . $e->getMessage() . "\n";
                            }
                        }
                    } else {
                        echo "      Sem inscrição Push para {$to}.\n";
                    }

                    // 4. Atualizar last_notified_at para auditoria
                    $upcIds = array_column($upcoming, 'id');
                    if (!empty($upcIds)) {
                        $placeholders = implode(',', array_fill(0, count($upcIds), '?'));
                        $stmtUpd      = $pdo->prepare("UPDATE transactions SET last_notified_at = NOW() WHERE id IN ({$placeholders})");
                        $stmtUpd->execute($upcIds);
                        echo "      Auditoria: last_notified_at atualizado para " . count($upcIds) . " transação(ões).\n";
                    }

                } catch (Exception $e) {
                    echo "      ❌ ERRO CRÍTICO ao processar usuário {$to}: " . $e->getMessage() . "\n";
                }
            } // end foreach users

        } catch (Exception $e) {
            echo "    ❌ ERRO CRÍTICO ao processar Org [{$orgName}]: " . $e->getMessage() . "\n";
        }

        echo "\n";
    } // end foreach organizations
    
    echo "=== PROCESSAMENTO CONCLUÍDO em " . date('Y-m-d H:i:s') . " ===\n";

} catch (Exception $e) {
    echo "❌ ERRO FATAL NO CRON: " . $e->getMessage() . "\n";
}
