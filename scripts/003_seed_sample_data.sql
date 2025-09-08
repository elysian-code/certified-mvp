-- Insert sample organization
INSERT INTO organizations (id, name, description, website) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'TechCorp Solutions', 'Leading technology certification provider', 'https://techcorp.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample certification programs
INSERT INTO certification_programs (id, organization_id, name, description, requirements, duration_months) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Cloud Architecture Certification', 'Comprehensive cloud architecture training and certification', 'Basic IT knowledge, 2+ years experience', 6),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Cybersecurity Fundamentals', 'Essential cybersecurity skills and best practices', 'Basic computer literacy', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample CBT test
INSERT INTO cbt_tests (id, program_id, name, description, passing_score, time_limit_minutes) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Cloud Architecture Assessment', 'Final assessment for cloud architecture certification', 75, 120)
ON CONFLICT (id) DO NOTHING;

-- Insert sample CBT questions
INSERT INTO cbt_questions (test_id, question_text, question_type, options, correct_answer, explanation) VALUES 
('550e8400-e29b-41d4-a716-446655440003', 'What is the primary benefit of cloud computing?', 'multiple_choice', 
 '["Cost reduction", "Scalability", "Security", "All of the above"]', 'All of the above', 
 'Cloud computing offers cost reduction, scalability, and enhanced security when properly implemented.'),
('550e8400-e29b-41d4-a716-446655440003', 'Is Infrastructure as a Service (IaaS) a cloud service model?', 'true_false', 
 '["True", "False"]', 'True', 
 'IaaS is indeed one of the three main cloud service models, along with PaaS and SaaS.')
ON CONFLICT DO NOTHING;
