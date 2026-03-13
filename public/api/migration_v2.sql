ALTER TABLE transactions 
ADD COLUMN due_date DATETIME NULL AFTER date,
ADD COLUMN payment_date DATETIME NULL AFTER due_date,
ADD COLUMN status VARCHAR(20) DEFAULT 'paid' AFTER payment_date,
ADD COLUMN is_fixed TINYINT(1) DEFAULT 0 AFTER status;

-- Atualizar registros existentes para 'paid'
UPDATE transactions SET status = 'paid';
