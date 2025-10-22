-- Add certificate_template column to certification_programs
ALTER TABLE certification_programs
ADD COLUMN IF NOT EXISTS certificate_template TEXT NOT NULL DEFAULT 'template1';
