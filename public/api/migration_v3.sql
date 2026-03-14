-- migration_v3.sql
-- Adiciona suporte para recuperação de senha (Fase 15)

ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(255) NULL AFTER fullName,
ADD COLUMN reset_expiry DATETIME NULL AFTER reset_token;

-- Nota: Esta alteração já foi aplicada via script PHP migrate_reset_tokens.php
