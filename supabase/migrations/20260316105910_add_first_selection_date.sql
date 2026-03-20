-- Add first_selection_date to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS first_selection_date DATE;
