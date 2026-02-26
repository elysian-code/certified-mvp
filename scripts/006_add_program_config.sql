-- Add program configuration columns
ALTER TABLE certification_programs
  ADD COLUMN IF NOT EXISTS report_submission_method TEXT NOT NULL DEFAULT 'end'
    CHECK (report_submission_method IN ('daily', 'end')),
  ADD COLUMN IF NOT EXISTS test_duration_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS questions_count INTEGER NOT NULL DEFAULT 20;

-- Add performance grade to test_attempts
ALTER TABLE test_attempts
  ADD COLUMN IF NOT EXISTS grade TEXT
    CHECK (grade IN ('excellent', 'good', 'pass', 'fair', 'fail'));

-- Add unique constraint to enforce one-time test attempt per employee
ALTER TABLE test_attempts
  ADD CONSTRAINT IF NOT EXISTS unique_employee_test_attempt
    UNIQUE (employee_id, test_id);
