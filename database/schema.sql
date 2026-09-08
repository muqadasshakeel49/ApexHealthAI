-- ==============================================================================
-- AI-Assisted Appointment Booking SaaS - PostgreSQL Database Schema
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Appointment Status ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
    END IF;
END$$;

-- Define Chat Message Role ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
        CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
    END IF;
END$$;

-- ------------------------------------------------------------------------------
-- 1. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique index on email (case-insensitive search friendly)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 2. Appointments Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    status appointment_status NOT NULL DEFAULT 'CONFIRMED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Access pattern indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Business Rule / Conflict Index:
-- Prevent double-booking: A user cannot hold more than one active appointment at the exact same date & time slot.
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_user_slot_conflict 
ON appointments(user_id, appointment_date, appointment_time) 
WHERE status != 'CANCELLED';

-- ------------------------------------------------------------------------------
-- 3. Chat Sessions Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Appointment Assistant',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- ------------------------------------------------------------------------------
-- 4. Chat Messages Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);

-- ------------------------------------------------------------------------------
-- Trigger for automatic updated_at timestamps
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
BEFORE UPDATE ON chat_sessions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
