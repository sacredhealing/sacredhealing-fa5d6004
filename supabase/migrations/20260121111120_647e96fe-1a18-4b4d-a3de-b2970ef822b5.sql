-- Add paper_balance column to track simulated trading balance
ALTER TABLE polymarket_bot_settings 
ADD COLUMN IF NOT EXISTS paper_balance DECIMAL(18,6) DEFAULT 1000.00;

-- Add total_fees_paid column to track cumulative fees
ALTER TABLE polymarket_bot_settings 
ADD COLUMN IF NOT EXISTS total_fees_paid DECIMAL(18,6) DEFAULT 0.00;