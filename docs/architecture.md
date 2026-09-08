# Architecture Overview

This document describes the end-to-end architecture, communication flows, component boundaries, and security considerations of the **ApexHealth AI Appointment Booking SaaS** application.

---

## High-Level System Architecture

```text
                                  +-----------------------+
                                  |     Client Browser    |
                                  |  (Desktop / Mobile)   |
                                  +-----------------------+
                                              |
                                              | HTTPS (HTML / CSS / JS)
                                              v
                                  +-----------------------+
                                  |   Next.js Frontend    |
                                  |     (Port 3000)       |
                                  |   - App Router        |
                                  |   - Tailwind CSS      |
                                  |   - React AuthContext |
                                  |   - Lucide Icons      |
                                  +-----------------------+
                                              |
                                              | REST API (JSON)
                                              | Authorization: Bearer <JWT>
                                              v
                                  +-----------------------+
                                  |    Express Backend    |
                                  |     (Port 5000)       |
                                  |   - Helmet & CORS     |
                                  |   - Rate Limiting     |
                                  |   - Zod Validators    |
                                  |   - Auth Middleware   |
                                  |   - Error Middleware  |
                                  +-----------------------+
                                      /               \
                                     /                 \
                                    /                   \
                                   v                     v
                 +-----------------------+    +-----------------------+
                 | PostgreSQL (Database) |    |  AI Service Layer     |
                 |      (Port 5432)      |    |  - AIService Interface|
                 |  - Users              |    |  - MistralAIService   |
                 |  - Appointments       |    |  - FallbackAIService  |
                 |  - Chat Sessions      |    +-----------------------+
                 |  - Chat Messages      |                |
                 |  - Prisma ORM         |                | HTTPS API
                 +-----------------------+                v
                                              +-----------------------+
                                              |      Mistral AI       |
                                              | (mistral-small-latest)|
                                              +-----------------------+
```

---

## Architectural Principles & Separation of Concerns

### 1. Frontend / Backend Separation
- **Frontend (Next.js)**: Responsible purely for the presentation tier, client-side routing, user feedback states (loading, empty, error, disabled), local session caching (`localStorage`), and responsive UI layouts.
- **Backend (Express)**: Responsible for authentication, token signing/verification, input validation with Zod schemas, business logic enforcement (e.g. date validation and slot conflict checks), database operations via Prisma, rate limiting, and structured logging.
- **Independence**: The frontend never talks directly to PostgreSQL or the Mistral API. All interactions pass through the Express REST API.

### 2. AI Boundary & Isolation
- The AI layer is isolated behind a strict TypeScript interface:
  ```typescript
  export interface AIService {
    processAppointmentConversation(
      messages: ConversationMessage[],
      referenceDate?: Date
    ): Promise<AIProcessResult>;
  }
  ```
- **The LLM Never Books Appointments**: The AI model's sole responsibility is language understanding, slot extraction (`service`, `date`, `time`, `notes`), missing field detection, and conversational assistance.
- **Human-in-the-Loop Confirmation**: When all required fields are extracted (`readyToBook: true`), the UI renders an interactive booking proposal. The appointment is only created when the user explicitly clicks **Confirm & Book Appointment**, which submits a request to `POST /api/appointments`.
- **Backend Verification**: Even if the AI outputs an appointment payload, the Express backend independently validates date constraints, time formats, and slot conflicts before writing to PostgreSQL.
- **Graceful Fallback**: If the Mistral API key is omitted, the network is unreachable, or the LLM output fails schema validation, the system falls back seamlessly to an internal deterministic regex/heuristic parser (`FallbackAIService`), guaranteeing 100% demo uptime and offline evaluation support.

---

## Detailed Communication Flows

### 1. Authentication Flow
```text
User                      Frontend                         Express Backend               PostgreSQL
 |                            |                                   |                           |
 |-- Enters email & pass ---->|                                   |                           |
 |   clicks "Sign In"         |-- POST /api/auth/login ---------->|                           |
 |                            |   { email, password }             |-- Query user by email --->|
 |                            |                                   |<-- User row with hash ----|
 |                            |                                   |-- bcrypt.compare()        |
 |                            |                                   |-- Sign JWT with secret    |
 |                            |<-- 200 { user, token } -----------|                           |
 |                            |-- Store token in localStorage     |                           |
 |<-- Redirect to /dashboard -|                                   |                           |
```

### 2. Multi-Turn Conversational Booking Flow
```text
User                      Frontend                         Express Backend             Mistral AI / Fallback
 |                            |                                   |                             |
 |-- "Book a dentist" ------->|                                   |                             |
 |                            |-- POST /api/chat/sessions/:id/messages                          |
 |                            |   { content: "Book a dentist" }   |                             |
 |                            |                                   |-- Persist USER message      |
 |                            |                                   |-- Fetch conversation history|
 |                            |                                   |-- Invoke AIService -------->|
 |                            |                                   |<-- Structured JSON output --|
 |                            |                                   |    (service: Dental,        |
 |                            |                                   |     missing: [date, time])  |
 |                            |                                   |-- Validate with Zod         |
 |                            |                                   |-- Persist ASSISTANT message |
 |                            |<-- 200 { assistantMessage } ------|                             |
 |<-- "What date works?" -----|                                   |                             |
 |                            |                                   |                             |
 |-- "Tomorrow at 3 PM" ----->|                                   |                             |
 |                            |-- POST /api/chat/sessions/:id/messages                          |
 |                            |   { content: "Tomorrow at 3 PM" } |                             |
 |                            |                                   |-- Persist USER message      |
 |                            |                                   |-- Invoke AIService -------->|
 |                            |                                   |<-- Structured JSON output --|
 |                            |                                   |    (date: YYYY-MM-DD,       |
 |                            |                                   |     time: 15:00,            |
 |                            |                                   |     readyToBook: true)      |
 |                            |<-- 200 { assistantMessage, -------|                             |
 |                            |         readyToBook: true }       |                             |
 |<-- Shows Confirmation Card-|                                   |                             |
```

### 3. Appointment Confirmation & Conflict Check Flow
```text
User                      Frontend                         Express Backend               PostgreSQL
 |                            |                                   |                           |
 |-- Clicks [Confirm Book] -->|                                   |                           |
 |                            |-- POST /api/appointments -------->|                           |
 |                            |   { service, date, time }         |-- Verify JWT              |
 |                            |                                   |-- Validate schema (Zod)   |
 |                            |                                   |-- Check date not in past  |
 |                            |                                   |-- Query conflicting slot->|
 |                            |                                   |<-- Slot availability -----|
 |                            |                                   |    [If conflict -> 409]   |
 |                            |                                   |-- Insert appointment ---->|
 |                            |                                   |<-- Created record --------|
 |                            |<-- 201 Created { appointment } ---|                           |
 |<-- "Appointment Confirmed"-|                                   |                           |
```

---

## Database Design & Indexing Strategy

### Tables
1. **`users`**: Manages credentials and profile information.
   - Primary Key: `id (UUID)`
   - Unique Index: `idx_users_email_unique` on `LOWER(email)`
2. **`appointments`**: Manages all scheduled bookings.
   - Primary Key: `id (UUID)`
   - Foreign Key: `user_id -> users(id) ON DELETE CASCADE`
   - Indexes:
     - `idx_appointments_user_id`: Fast dashboard lookups per authenticated user.
     - `idx_appointments_date`: Date range queries and filtering.
     - `idx_appointments_user_date`: Composite index for calendar queries.
     - `idx_appointments_user_slot_conflict`: Partial unique index on `(user_id, appointment_date, appointment_time) WHERE status != 'CANCELLED'`. Prevents double bookings at the database level.
3. **`chat_sessions`**: Groups conversations per user.
   - Primary Key: `id (UUID)`
   - Foreign Key: `user_id -> users(id) ON DELETE CASCADE`
   - Index: `idx_chat_sessions_user_id`, `idx_chat_sessions_updated_at`
4. **`chat_messages`**: Multi-turn message history with AI evaluation metadata.
   - Primary Key: `id (UUID)`
   - Foreign Key: `session_id -> chat_sessions(id) ON DELETE CASCADE`
   - `metadata (JSONB)`: Stores model name, latency in milliseconds, intent, extracted appointment slots, and fallback flags.
   - Index: `idx_chat_messages_session_id`, `idx_chat_messages_created_at`

---

## Security Considerations

1. **Password Security**: Passwords are never stored in plain text. Hashed using `bcryptjs` with a cost factor of 10.
2. **JWT Authentication**: Signed with HMAC SHA-256 and expires after a configurable window (`JWT_EXPIRES_IN=7d`). Middleware verifies tokens and attaches authenticated user context.
3. **HTTP Security Headers**: `helmet` is installed and active on all Express routes.
4. **CORS Policy**: Configured to accept requests strictly from authorized frontend origins (`http://localhost:3000`).
5. **Rate Limiting**:
   - Standard API endpoints: 100 requests / 15 minutes.
   - Auth endpoints (`/login`, `/register`): 20 requests / 15 minutes to thwart brute-force password guessing.
   - AI endpoints (`/api/chat/sessions/:id/messages`): 30 requests / 1 minute to prevent LLM quota exhaustion.
6. **Secrets & Credentials Sanitization**: Structured logs run through a recursive sanitizer that automatically redacts fields named `password`, `token`, `authorization`, `jwt`, `secret`, or `apikey`.
