-- Create stored procedure for verifying and accepting invites
create or replace function verify_and_accept_invite(
  p_invite_token uuid,
  p_user_id uuid,
  p_program_id uuid
) returns json as $$
declare
  v_invite record;
  v_result json;
begin
  -- Get and lock the invite record
  select * into v_invite
  from employee_invites
  where invite_token = p_invite_token
    and status = 'pending'
  for update;

  -- Check if invite exists and is valid
  if v_invite is null then
    return json_build_object(
      'error', true,
      'message', 'Invitation not found or already processed'
    );
  end if;

  -- Check if invite has expired
  if v_invite.expires_at < now() then
    update employee_invites
    set status = 'expired',
        updated_at = now()
    where id = v_invite.id;

    return json_build_object(
      'error', true,
      'message', 'Invitation has expired'
    );
  end if;

  -- Update invite status
  update employee_invites
  set status = 'accepted',
      accepted_at = now(),
      user_id = p_user_id,
      updated_at = now()
  where id = v_invite.id;

  -- Create program enrollment
  insert into employee_progress (
    employee_id,
    program_id,
    status,
    progress_percentage,
    enrolled_at
  ) values (
    p_user_id,
    p_program_id,
    'in_progress',
    0,
    now()
  );

  -- Return success result with organization_id
  return json_build_object(
    'error', false,
    'organization_id', v_invite.organization_id
  );

exception when others then
  -- Log error details (in production, use proper logging)
  raise notice 'Error in verify_and_accept_invite: %', SQLERRM;
  
  -- Return error result
  return json_build_object(
    'error', true,
    'message', 'Failed to process invitation: ' || SQLERRM
  );
end;
$$ language plpgsql security definer;