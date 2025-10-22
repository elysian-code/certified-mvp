-- Add program_id to employee_invites table
ALTER TABLE employee_invites 
ADD COLUMN program_id uuid REFERENCES certification_programs(id),
ADD COLUMN status varchar(20) DEFAULT 'pending' NOT NULL;

-- Add index for faster lookup
CREATE INDEX idx_employee_invites_program ON employee_invites(program_id);

-- Add index for status filtering
CREATE INDEX idx_employee_invites_status ON employee_invites(status);

-- Add check constraint for status values
ALTER TABLE employee_invites 
ADD CONSTRAINT employee_invites_status_check 
CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));