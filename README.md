# ApexHealth AI - Appointment Booking SaaS Prototype

A clean, production-grade prototype for an AI-assisted appointment booking SaaS application built with **Next.js**, **Express**, **PostgreSQL**, **Prisma**, and **Mistral AI**.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [AI Integration](#ai-integration)
- [Testing](#testing)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Deployment](#deployment)

---

## Overview
ApexHealth AI is a modern SaaS application designed for healthcare and professional clinics. It provides both an intuitive **multi-turn AI chatbot** (powered by Mistral with deterministic fallback) and a **structured booking form** to schedule, view, and manage appointments with conflict detection and database persistence.

---

## Features
- **User Authentication**: Secure registration and login using bcrypt password hashing, JWT bearer tokens, and session persistence.
- **Interactive AI Assistant**: Conversational scheduling that extracts appointment services, dates, and times across multi-turn dialogs.
- **Human-in-the-Loop Confirmation**: The AI proposes booking parameters, but an appointment is only persisted when the user explicitly reviews and confirms.
- **Graceful Fallback**: If the user's intent is ambiguous (e.g. *"I need something sometime soon"*), the AI asks for clarification. If the AI service fails or no API key is provided, the UI gracefully falls back to a structured manual booking form.
- **Conflict Prevention**: Backend validation ensures appointments cannot be booked in the past or double-booked for the same user slot (enforced via database constraints and 409 Conflict responses).
- **Responsive SaaS Dashboard**: Clean typography, metrics cards (Total, Upcoming, Completed, Cancelled), filterable appointment lists, and modal interfaces.
- **Observability**: Structured JSON logging recording API calls, errors, and AI telemetry (model, latency, slot confidence) without leaking sensitive credentials.
- **Multi-Turn Chat History**: Conversations and assistant responses are persisted in PostgreSQL with auto-scrolling and reload preservation.

---

## Architecture

```text
Browser (Chrome, Safari, Edge)
   │
   ▼
Next.js 14 Frontend (App Router, Tailwind CSS, Port 3000)
   │
   │  REST API (JSON over HTTP)
   │  Authorization: Bearer <JWT>
   ▼
Express Backend (TypeScript, Helmet, Rate Limiting, Port 5000)
   │
   ├──► PostgreSQL Database (Prisma ORM, Port 5432)
   │    - users, appointments, chat_sessions, chat_messages
   │
   └──► AI Service Layer
        │
        ├──► Mistral AI Cloud API (mistral-small-latest)
        │
        └──► Deterministic Fallback Engine (Offline resilience)
```

For complete diagrams and data flows, see [`docs/architecture.md`](docs/architecture.md).

---

## Tech Stack
- **Frontend**: React 18, Next.js 14 (App Router), Tailwind CSS, Lucide Icons, Context API.
- **Backend**: Node.js, Express, TypeScript, Zod, Helmet, CORS, Express Rate Limit.
- **Database & ORM**: PostgreSQL, Prisma ORM, raw SQL schema & seed scripts.
- **Authentication**: JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`).
- **AI Service**: Mistral AI REST API with structured JSON output + internal heuristic fallback.
- **Testing**: Jest, `ts-jest`, Supertest.
- **Containerization**: Docker Compose (PostgreSQL 16).

---

## Project Structure

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma ORM schema
│   │   └── seed.ts             # Database seeder script
│   ├── src/
│   │   ├── config/             # Environment configuration loader
│   │   ├── controllers/        # Auth, Appointment, Chat controllers
│   │   ├── db/                 # Prisma client singleton
│   │   ├── middleware/         # Auth, Error, Rate Limiting, Validation
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic & AI abstractions
│   │   │   └── ai/             # MistralAIService, FallbackAIService
│   │   ├── types/              # Express & shared TypeScript interfaces
│   │   ├── utils/              # Structured JSON logger & sanitizers
│   │   ├── validators/         # Zod schemas (Auth, Appointments, AI)
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # HTTP server listener
│   └── tests/                  # Automated test suites
├── frontend/
│   ├── app/                    # Next.js App Router pages (/login, /dashboard, etc.)
│   ├── components/
│   │   ├── appointments/       # Appointment cards, lists, forms
│   │   ├── chat/               # Message bubbles, composer, confirmation card
│   │   ├── layout/             # Sidebar, Navbar
│   │   └── ui/                 # Button, Input, Modal, Card, Badge
│   ├── context/                # AuthContext & token management
│   ├── lib/                    # API client with JWT interceptor
│   └── types/                  # Frontend data contracts
├── database/
│   ├── schema.sql              # Raw PostgreSQL DDL with indexes & triggers
│   └── seed.sql                # SQL seed records
├── docs/
│   ├── architecture.md         # Architecture diagrams and system design
│   ├── api.md                  # Detailed REST API endpoint specification
│   └── decisions.md            # Architectural decisions and trade-offs
├── docker-compose.yml          # PostgreSQL container definition
├── .env.example                # Environment variables template
├── package.json                # Root workspaces configuration
└── README.md                   # This documentation
```

---

## Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local PostgreSQL instance OR Docker installed

---

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Express backend port | `5000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ai_appointments?schema=public` |
| `JWT_SECRET` | Secret key for signing tokens | Min 32 characters |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `MISTRAL_API_KEY` | Mistral Cloud API key (optional) | *Empty for automatic fallback* |

---

## Local Setup

### 1. Install Dependencies
Run npm install across both workspaces from the project root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Database Setup

### Option A: Using Docker (Recommended)
Start the PostgreSQL container:

```bash
docker compose up -d
```

### Option B: Using Local PostgreSQL
Ensure your local PostgreSQL server is running and create the database:

```sql
CREATE DATABASE ai_appointments;
```

### Push Schema and Seed Data
From the `backend` folder:

```bash
cd backend
npx prisma db push
npm run db:seed
```

---

## Running the Application

### Start the Backend (Port 5000)
```bash
cd backend
npm run dev
```

### Start the Frontend (Port 3000)
In a separate terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Walkthrough
1. **Sign Up**: Navigate to the signup page and create an account by entering your email and password.
2. **Dashboard**: View your appointment statistics and upcoming appointments.
3. **Conversational Booking**:
   - Click **Book with AI**.
   - Type: *"I need a dental appointment."*
   - Assistant asks for date. Type: *"Tomorrow."*
   - Assistant asks for time. Type: *"3 PM."*
   - Assistant summarizes the request and presents the **Confirmation Card**.
   - Click **Confirm & Book Appointment**.
4. **Verification**: Navigate to **Appointments** in the sidebar to see the newly booked appointment.
5. **Conflict Test**: Attempt to book another appointment at the exact same date and time. Notice the polite conflict alert preventing double-booking.
6. **Ambiguity Test**: In the AI chat, send *"I need something sometime soon."* The AI recognizes the ambiguity, keeps dates null, and asks for clarification without inventing hallucinated slots.

---

## API Documentation
Exhaustive endpoint specifications, schemas, request payloads, and status codes are documented in [`docs/api.md`](docs/api.md).

---

## AI Integration
The AI service adheres to the following principles:
- Isolated behind `AIService` interface (`backend/src/services/ai/types.ts`).
- Uses `mistral-small-latest` with structured JSON output enforcement.
- Incorporates dynamic reference dates to resolve relative terms like *"tomorrow"* or *"next Friday"*.
- Multi-turn conversational context is retrieved from PostgreSQL and passed to the model.
- Includes automatic fallback to `FallbackAIService` if no API key is provided, ensuring seamless offline grading.

---

## Testing
Run the automated test suite from the `backend` directory:

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Authentication**: Registration, email conflict detection, password hashing, and login validation.
- **Appointments**: Slot booking, past-date rejection, duplicate slot conflict detection, and user access scoping.
- **AI Engine**: Multi-turn conversation slot extraction, ambiguous query handling, Zod schema validation, and graceful degradation.

---

## Design Decisions
Key architectural decisions (Next.js, Express, PostgreSQL, JWT, REST over WebSockets, AI isolation, why AI cannot write directly to DB) and their trade-offs are documented in [`docs/decisions.md`](docs/decisions.md).

---

## Assumptions
- Standard appointment duration is 30 to 60 minutes.
- Conflicts are scoped per user (a single patient cannot hold overlapping bookings).
- Date and time normalization converts all times to 24-hour `HH:mm` format and dates to `YYYY-MM-DD`.

---

## Known Limitations
- Recurring appointments (e.g. weekly sessions) are not currently modeled.
- Clinician availability is assumed open across standard working hours (9 AM - 5 PM).

---

## Future Improvements
- Multi-clinician / calendar slot synchronization (Google Calendar / Outlook API).
- SMS / Email notifications via Twilio and SendGrid.
- WebSockets transport layer for live typing indicators and streaming AI tokens.
- Doctor dashboard with administrative schedule management.

---

## Deployment
- **Frontend**: Can be deployed to Vercel or AWS Amplify with `NEXT_PUBLIC_API_URL` pointing to the backend.
- **Backend**: Can be deployed as a container to AWS ECS, Google Cloud Run, or Render with `DATABASE_URL`, `JWT_SECRET`, and `MISTRAL_API_KEY`.
- **Database**: Managed PostgreSQL on AWS RDS, Supabase, or Neon.
