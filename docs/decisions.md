# Architectural & Technical Decisions

This document records the primary architectural decisions, technical trade-offs, and design rationale made during the development of the **ApexHealth AI Appointment Booking SaaS** application.

---

### 1. Why Next.js (App Router) for Frontend
- **Decision**: Use Next.js 14 with the App Router, React 18, and Tailwind CSS.
- **Rationale**: Next.js provides a first-class developer experience with built-in client/server component boundaries, unified routing (`/login`, `/register`, `/dashboard`, `/appointments`, `/assistant`), optimized production bundling, and fast refresh. Tailwind CSS enables responsive, accessible design tokens without CSS bloat or runtime overhead.
- **Trade-off**: Slightly larger node_modules footprint than a bare Vite setup, but gives production-grade routing, layout nesting, and reverse-proxy rewrites without additional tools.

---

### 2. Why Express for the Backend
- **Decision**: Use Express in TypeScript as a dedicated REST API service.
- **Rationale**: Express is the industry standard for Node.js REST servers. It offers transparent middleware composition (Helmet, CORS, rate limiting, authentication), predictable request lifecycles, and trivial testability via `supertest`.
- **Trade-off**: Unlike opinionated frameworks like NestJS, Express requires explicit architecture discipline (controllers, services, repositories) which we established through clean folder separation.

---

### 3. Why PostgreSQL & Prisma ORM
- **Decision**: Use PostgreSQL with Prisma ORM and raw SQL DDL schemas.
- **Rationale**: Appointments require strict ACID transactional guarantees, foreign key integrity (`ON DELETE CASCADE`), relational constraints, and timestamp auditing. Prisma provides type-safe query generation, migrations, and model introspection, while the standalone `database/schema.sql` guarantees portability across any SQL runner or container.
- **Trade-off**: Setting up a relational database requires schema migrations and seed scripts, but completely eliminates data inconsistency issues present in document stores like MongoDB.

---

### 4. Why JWT (JSON Web Tokens) Authentication
- **Decision**: Stateless JWT bearer tokens stored in the browser and verified on each protected Express endpoint.
- **Rationale**: Stateless JWTs avoid server-side session stores (like Redis) for this stage of the SaaS lifecycle. The token securely encodes the user's UUID and email. Expired tokens are immediately caught by middleware and the frontend redirects the user back to `/login`.
- **Trade-off**: Token revocation before expiration requires token blacklisting or short token lifetimes. We use standard 7-day expiration with immediate re-login triggers on 401s.

---

### 5. Why REST over WebSockets for Chat
- **Decision**: Use standard HTTP POST/GET requests for conversational exchanges rather than bidirectional WebSockets.
- **Rationale**: The assessment requires near-real-time or interactive chat. HTTP POST simplifies request authentication, standard rate-limiting, edge caching, error recovery, and load balancing without the overhead of maintaining persistent WebSocket connections, ping/pong heartbeats, and stateful socket servers.
- **Trade-off**: The frontend handles optimistic UI updates and waiting states locally. The chat architecture is structured so a WebSocket gateway (e.g. Socket.io) could be slotted in behind `ChatService` without changing business logic.

---

### 6. Why AI is Isolated Behind an AIService Abstraction
- **Decision**: Define a generic `AIService` interface and implement both `MistralAIService` and `FallbackAIService`.
- **Rationale**: Tying business controllers directly to the Mistral SDK creates tight coupling and vendor lock-in. By abstracting the AI behind `processAppointmentConversation()`, we can swap Mistral for Anthropic Claude, OpenAI, or local Llama models with zero alterations to `ChatService` or the Express routes. Furthermore, if Mistral API keys are omitted or the provider suffers downtime, our fallback engine automatically guarantees full functionality for interview demos and tests.

---

### 7. Why the AI Cannot Directly Create Appointments
- **Decision**: The LLM is restricted to understanding intent and extracting slots (`service`, `date`, `time`). The database record is created only after explicit user confirmation via the backend.
- **Rationale**: LLMs are non-deterministic and can hallucinate or misinterpret user intent. Allowing an AI to directly execute database writes introduces severe risks: unintended bookings, double bookings, scheduling appointments in the past, or bypassing business logic. Enforcing human-in-the-loop confirmation and backend validation ensures zero unauthorized database mutations.

---

### 8. Why AI Output is Validated with Zod
- **Decision**: Pass raw AI JSON output through a strict Zod schema (`aiOutputSchema`) before saving or returning it.
- **Rationale**: Even with `response_format: { type: 'json_object' }`, LLMs may occasionally return incomplete keys, unexpected types, or malformed payloads. Zod validates that `reply` is present, `missingFields` is an array of strings, and `appointment` has the required structure. If validation fails, the backend catches the error and degrades gracefully.

---

### 9. Why Chat Messages are Persisted in PostgreSQL
- **Decision**: Persist every user and assistant message along with AI telemetry metadata in `chat_messages`.
- **Rationale**:
  1. Multi-turn context: The AI needs conversational history to understand follow-up replies like "Tomorrow" or "3 PM".
  2. UX: Users can refresh the page, switch devices, or return later without losing their conversation.
  3. Observability: Storing model names, response latency, and confidence enables performance auditing and prompt tuning.

---

### 10. Why Database Indexes and Conflict Constraints Were Added
- **Decision**: Added composite indexes on `appointments(user_id, appointment_date)` and a partial unique index on `(user_id, appointment_date, appointment_time) WHERE status != 'CANCELLED'`.
- **Rationale**:
  - Eliminates table scans when rendering a user's dashboard or checking for scheduling conflicts.
  - Prevents race conditions: even if two concurrent requests attempt to book the exact same slot, the database-level partial unique index will reject the second transaction with a unique constraint violation.

---

### 11. Why a Modular Monolith Instead of Microservices
- **Decision**: Single monorepo containing `/frontend` and `/backend` with clean modular service/controller boundaries.
- **Rationale**: For an early-stage SaaS application and technical skills evaluation, microservices introduce massive unnecessary complexity (distributed transactions, gRPC/service mesh overhead, complex container orchestration, and difficult local setup). A modular monolith achieves identical separation of concerns, high maintainability, and clean testability without deployment friction.

---

### 12. Appointment Conflict Strategy
- **Decision**: When a user requests an appointment, the backend queries for any non-cancelled appointment belonging to that user matching the exact date and time.
- **Rationale**: Returning HTTP 409 Conflict with details on the conflicting slot gives immediate, actionable feedback to the user and AI, allowing the user to select an alternate time without crashing the booking flow.
