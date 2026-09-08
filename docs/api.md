# API Documentation

This document describes all REST API endpoints available in the backend service.

Base URL: `http://localhost:5000/api`

---

## Standard Response Envelope

All API endpoints return a standardized JSON envelope.

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_NAME",
    "message": "Human-readable description of error",
    "details": [ ... ]
  }
}
```

---

## Authentication Endpoints

### 1. Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Authentication**: None
- **Rate Limit**: 20 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Alex Morgan"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "email": "user@example.com",
        "name": "Alex Morgan",
        "createdAt": "2026-09-07T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Possible Errors**:
  - `400 Bad Request` (`VALIDATION_ERROR`): Invalid email, short password, or empty name.
  - `409 Conflict` (`EMAIL_EXISTS`): User with this email already registered.
  - `429 Too Many Requests` (`AUTH_RATE_LIMIT_EXCEEDED`).

---

### 2. Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Authentication**: None
- **Rate Limit**: 20 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "email": "user@example.com",
        "name": "Alex Morgan",
        "createdAt": "2026-09-07T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Possible Errors**:
  - `400 Bad Request` (`VALIDATION_ERROR`).
  - `401 Unauthorized` (`INVALID_CREDENTIALS`): Incorrect email or password.
  - `429 Too Many Requests` (`AUTH_RATE_LIMIT_EXCEEDED`).

---

### 3. Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Authentication**: `Bearer <JWT>`
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "email": "user@example.com",
        "name": "Alex Morgan",
        "createdAt": "2026-09-07T10:00:00.000Z",
        "updatedAt": "2026-09-07T10:00:00.000Z"
      }
    }
  }
  ```
- **Possible Errors**:
  - `401 Unauthorized` (`UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN`).
  - `404 Not Found` (`USER_NOT_FOUND`).

---

## Appointments Endpoints

### 4. Create Appointment
- **Method**: `POST`
- **Path**: `/api/appointments`
- **Authentication**: `Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "service": "General Dental Checkup",
    "appointmentDate": "2026-09-10",
    "appointmentTime": "14:00",
    "notes": "Regular 6-month cleaning"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "service": "General Dental Checkup",
      "appointmentDate": "2026-09-10T00:00:00.000Z",
      "appointmentTime": "14:00",
      "status": "CONFIRMED",
      "notes": "Regular 6-month cleaning",
      "createdAt": "2026-09-07T10:30:00.000Z",
      "updatedAt": "2026-09-07T10:30:00.000Z"
    }
  }
  ```
- **Possible Errors**:
  - `400 Bad Request` (`VALIDATION_ERROR`, `INVALID_DATE` if appointment is in the past).
  - `401 Unauthorized` (`UNAUTHORIZED`).
  - `409 Conflict` (`APPOINTMENT_CONFLICT`): User already has an active appointment at the requested date and time.

---

### 5. List Appointments
- **Method**: `GET`
- **Path**: `/api/appointments`
- **Authentication**: `Bearer <JWT>`
- **Query Parameters**:
  - `status` (optional): `CONFIRMED` | `PENDING` | `CANCELLED` | `COMPLETED`
  - `from` (optional): `YYYY-MM-DD`
  - `to` (optional): `YYYY-MM-DD`
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
        "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "service": "General Dental Checkup",
        "appointmentDate": "2026-09-10T00:00:00.000Z",
        "appointmentTime": "14:00",
        "status": "CONFIRMED",
        "notes": "Regular 6-month cleaning",
        "createdAt": "2026-09-07T10:30:00.000Z",
        "updatedAt": "2026-09-07T10:30:00.000Z"
      }
    ]
  }
  ```

---

### 6. Get Appointment By ID
- **Method**: `GET`
- **Path**: `/api/appointments/:id`
- **Authentication**: `Bearer <JWT>`
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "service": "General Dental Checkup",
      "appointmentDate": "2026-09-10T00:00:00.000Z",
      "appointmentTime": "14:00",
      "status": "CONFIRMED",
      "notes": "Regular 6-month cleaning"
    }
  }
  ```
- **Possible Errors**:
  - `403 Forbidden` (`FORBIDDEN`): Appointment belongs to another user.
  - `404 Not Found` (`APPOINTMENT_NOT_FOUND`).

---

### 7. Update Appointment Status
- **Method**: `PATCH`
- **Path**: `/api/appointments/:id/status`
- **Authentication**: `Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "status": "CANCELLED"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
      "status": "CANCELLED",
      "updatedAt": "2026-09-07T11:00:00.000Z"
    }
  }
  ```

---

### 8. Pre-Flight Slot Validation
- **Method**: `POST`
- **Path**: `/api/appointments/validate`
- **Authentication**: `Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "service": "Dental Checkup",
    "appointmentDate": "2026-09-10",
    "appointmentTime": "14:00"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "available": true,
      "service": "Dental Checkup",
      "appointmentDate": "2026-09-10",
      "appointmentTime": "14:00"
    }
  }
  ```
- **Possible Errors**:
  - `409 Conflict` (`APPOINTMENT_CONFLICT`): Slot unavailable.

---

## Chat & AI Endpoints

### 9. Create Chat Session
- **Method**: `POST`
- **Path**: `/api/chat/sessions`
- **Authentication**: `Bearer <JWT>`
- **Request Body** (optional):
  ```json
  {
    "title": "Dental Booking"
  }
  ```
- **Success Response** (`201 Created`): Returns newly created session with the assistant's initial welcome message.

---

### 10. List Chat Sessions
- **Method**: `GET`
- **Path**: `/api/chat/sessions`
- **Authentication**: `Bearer <JWT>`
- **Success Response** (`200 OK`): Array of chat sessions ordered by latest update.

---

### 11. Get Session Messages
- **Method**: `GET`
- **Path**: `/api/chat/sessions/:id/messages`
- **Authentication**: `Bearer <JWT>`
- **Success Response** (`200 OK`): Array of messages with role, content, and AI evaluation metadata.

---

### 12. Post Message to AI Assistant
- **Method**: `POST`
- **Path**: `/api/chat/sessions/:id/messages`
- **Authentication**: `Bearer <JWT>`
- **Rate Limit**: 30 requests / 1 minute
- **Request Body**:
  ```json
  {
    "content": "I need a dental appointment tomorrow at 3 PM"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "userMessage": {
        "id": "msg-1",
        "role": "USER",
        "content": "I need a dental appointment tomorrow at 3 PM"
      },
      "assistantMessage": {
        "id": "msg-2",
        "role": "ASSISTANT",
        "content": "Great! I have gathered your details for a General Dental Checkup on 2026-09-08 at 15:00. Please confirm below.",
        "metadata": {
          "model": "mistral-small-latest",
          "latencyMs": 480,
          "intent": "BOOK_APPOINTMENT",
          "readyToBook": true,
          "extractedAppointment": {
            "service": "General Dental Checkup",
            "date": "2026-09-08",
            "time": "15:00",
            "notes": null
          }
        }
      },
      "aiEvaluation": {
        "reply": "Great! I have gathered your details...",
        "intent": "BOOK_APPOINTMENT",
        "appointment": {
          "service": "General Dental Checkup",
          "date": "2026-09-08",
          "time": "15:00",
          "notes": null
        },
        "missingFields": [],
        "readyToBook": true
      }
    }
  }
  ```
