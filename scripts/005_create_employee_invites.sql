-- Create employee_invites table
create table employee_invites (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  email varchar(255) not null,
  full_name varchar(255) not null,
  invite_token uuid not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  invited_by uuid not null references profiles(id),
  status varchar(50) default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  accepted_at timestamp with time zone,
  constraint unique_pending_invite unique (email, organization_id, status) where status = 'pending'
);

-- Create trigger to update updated_at timestamp
create trigger update_employee_invites_updated_at 
  before update on employee_invites
  for each row
  execute procedure update_updated_at_column();

-- Create index for faster lookups
create index employee_invites_organization_id_idx on employee_invites(organization_id);
create index employee_invites_email_idx on employee_invites(email);
create index employee_invites_invite_token_idx on employee_invites(invite_token);
create index employee_invites_status_idx on employee_invites(status);

-- Create security policies
alter table employee_invites enable row level security;

-- Organization admin can see all invites for their organization
create policy "Organization admin can view their organization's invites"
  on employee_invites for select
  using (
    organization_id in (
      select organization_id 
      from profiles 
      where id = auth.uid() 
        and role = 'organization_admin'
    )
  );

-- Organization admin can create invites for their organization
create policy "Organization admin can create invites"
  on employee_invites for insert
  with check (
    organization_id in (
      select organization_id 
      from profiles 
      where id = auth.uid() 
        and role = 'organization_admin'
    )
  );

-- Organization admin can update invites for their organization
create policy "Organization admin can update their organization's invites"
  on employee_invites for update
  using (
    organization_id in (
      select organization_id 
      from profiles 
      where id = auth.uid() 
        and role = 'organization_admin'
    )
  );

-- Organization admin can delete invites for their organization
create policy "Organization admin can delete their organization's invites"
  on employee_invites for delete
  using (
    organization_id in (
      select organization_id 
      from profiles 
      where id = auth.uid() 
        and role = 'organization_admin'
    )
  );