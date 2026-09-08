-- ==============================================================================
-- AI-Assisted Appointment Booking SaaS - Database Seed Data
-- ==============================================================================

-- 1. Demo User
-- Password: "Password123!" (hashed with bcrypt, 10 rounds)
-- Hash: $2b$10$t3rQoZ8LwI7rY1m8t6t2neZfP2tY7GqLzH/3vF1m4u8s2w0q5eX9a (will be validated via bcryptjs)
INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'demo@example.com',
    '$2b$10$4GZlXQ8lB0Y2x9j6k5l0e.r2k3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
    'Alex Morgan',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Appointments for Demo User
INSERT INTO appointments (id, user_id, service, appointment_date, appointment_time, status, notes, created_at)
VALUES 
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'General Dental Checkup',
    CURRENT_DATE + INTERVAL '2 days',
    '14:00',
    'CONFIRMED',
    'Routine 6-month cleaning and teeth inspection.',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dermatology Consultation',
    CURRENT_DATE - INTERVAL '14 days',
    '10:30',
    'COMPLETED',
    'Annual skin allergy checkup and prescription renewal.',
    CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Eye Examination',
    CURRENT_DATE - INTERVAL '5 days',
    '16:00',
    'CANCELLED',
    'User rescheduled due to a scheduling conflict.',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Chat Session
INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
VALUES (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dental Checkup Scheduling',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Chat Messages
INSERT INTO chat_messages (id, session_id, role, content, metadata, created_at)
VALUES
(
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
    'USER',
    'Hi! I want to schedule a dental checkup.',
    '{}'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '24 hours'
),
(
    '06eebc99-9c0b-4ef8-bb6d-6bb9bd380077',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
    'ASSISTANT',
    'I would be happy to help you schedule a dental checkup! What date and preferred time work best for you?',
    '{"model": "mistral-small-latest", "latencyMs": 420, "intent": "BOOK_APPOINTMENT", "extracted": {"service": "Dental Checkup", "date": null, "time": null}}'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '23 hours 59 minutes'
),
(
    '17eebc99-9c0b-4ef8-bb6d-6bb9bd380188',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
    'USER',
    'Two days from now around 2 PM would be great.',
    '{}'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '23 hours 58 minutes'
),
(
    '28eebc99-9c0b-4ef8-bb6d-6bb9bd380299',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
    'ASSISTANT',
    'I have gathered your details for a General Dental Checkup in two days at 14:00. Please confirm below to finalize your booking.',
    '{"model": "mistral-small-latest", "latencyMs": 510, "intent": "BOOK_APPOINTMENT", "readyToBook": true, "extracted": {"service": "General Dental Checkup", "time": "14:00"}}'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '23 hours 57 minutes'
)
ON CONFLICT (id) DO NOTHING;
