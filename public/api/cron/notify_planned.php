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
        $stmtUsers = $pdo->prepare("SELECT u.email, u.fullName 
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
                AND DATE(t.due_date) = DATE_ADD(CURDATE(), INTERVAL COALESCE(t.reminderDays, ?) DAY)";
                
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
            $message .= "http://127.0.0.1:5173/planning\n\n";
            $message .= "Atenciosamente,\nEquipe Finanças";
            
            try {
                $mailer->send($to, $subject, $message);
                echo "E-mail enviado para {$to}\n";
            } catch (Exception $e) {
                echo "ERRO ao enviar para {$to}: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "Processamento concluído.\n";

} catch (Exception $e) {
    echo "ERRO CRÍTICO NO CRON: " . $e->getMessage() . "\n";
}
