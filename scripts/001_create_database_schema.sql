-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organization_admin', 'employee')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certification programs table
CREATE TABLE IF NOT EXISTS certification_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  duration_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES certification_programs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
  verification_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CBT tests table
CREATE TABLE IF NOT EXISTS cbt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES certification_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CBT questions table
CREATE TABLE IF NOT EXISTS cbt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES cbt_tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee progress table
CREATE TABLE IF NOT EXISTS employee_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES certification_programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed')) DEFAULT 'enrolled',
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES cbt_tests(id) ON DELETE CASCADE,
  score INTEGER,
  passed BOOLEAN,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB, -- Store answers as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee reports table
CREATE TABLE IF NOT EXISTS employee_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES certification_programs(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('progress', 'completion', 'assessment')),
  content TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')) DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations viewable by members" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Organizations manageable by admins" ON organizations FOR ALL
  USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles viewable by same organization" ON profiles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view and update own profile" ON profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "Organization admins can manage profiles" ON profiles FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin'));

-- RLS Policies for certification programs
CREATE POLICY "Programs viewable by organization members" ON certification_programs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Programs manageable by organization admins" ON certification_programs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin'));

-- RLS Policies for certificates
CREATE POLICY "Certificates viewable by organization members" ON certificates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Certificates manageable by organization admins" ON certificates FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin'));

-- RLS Policies for CBT tests
CREATE POLICY "CBT tests viewable by organization members" ON cbt_tests FOR SELECT
  USING (program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "CBT tests manageable by organization admins" ON cbt_tests FOR ALL
  USING (program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin')));

-- RLS Policies for CBT questions
CREATE POLICY "CBT questions viewable by organization members" ON cbt_questions FOR SELECT
  USING (test_id IN (SELECT id FROM cbt_tests WHERE program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))));

CREATE POLICY "CBT questions manageable by organization admins" ON cbt_questions FOR ALL
  USING (test_id IN (SELECT id FROM cbt_tests WHERE program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin'))));

-- RLS Policies for employee progress
CREATE POLICY "Employee progress viewable by organization members" ON employee_progress FOR SELECT
  USING (program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Employees can view own progress" ON employee_progress FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Organization admins can manage employee progress" ON employee_progress FOR ALL
  USING (program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin')));

-- RLS Policies for test attempts
CREATE POLICY "Test attempts viewable by organization admins" ON test_attempts FOR SELECT
  USING (test_id IN (SELECT id FROM cbt_tests WHERE program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin'))));

CREATE POLICY "Employees can view own test attempts" ON test_attempts FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create test attempts" ON test_attempts FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- RLS Policies for employee reports
CREATE POLICY "Employee reports viewable by organization admins" ON employee_reports FOR SELECT
  USING (program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin')));

CREATE POLICY "Employees can view own reports" ON employee_reports FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create reports" ON employee_reports FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Organization admins can update reports" ON employee_reports FOR UPDATE
  USING (program_id IN (SELECT id FROM certification_programs WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'organization_admin')));
