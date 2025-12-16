-- Add application_message column to applications table
-- This allows reviewers to submit a free-form message when applying to campaigns

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS application_message TEXT;

-- Add comment to the column
COMMENT ON COLUMN applications.application_message IS 'Free-form message from reviewer explaining why they want to participate';
