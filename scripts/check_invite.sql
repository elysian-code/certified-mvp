-- Check invite details
SELECT 
  id,
  email,
  full_name,
  organization_id,
  program_id,
  status,
  invite_token,
  expires_at,
  created_at,
  updated_at
FROM employee_invites
WHERE invite_token = 'cafda741-370a-4957-b04a-f6cb60401499';