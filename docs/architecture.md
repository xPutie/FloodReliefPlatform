# System Architecture

## 1. Architecture Style

The system uses a modular monolith architecture.

The backend is organized into business modules while running as a single backend application.

---

## 2. Main Components

### Frontend
- React
- TypeScript
- Mobile-first UI
- PWA support

### Backend
- Node.js
- TypeScript
- REST API
- Business logic
- Validation
- Authentication and authorization

### Database
- MySQL
- Stores relational business data

### AI Service
- Used later for decision support
- AI recommendations must be reviewed by the Rescue Coordinator

---

## 3. Communication

Frontend communicates with Backend through REST APIs.

Backend communicates with MySQL for persistent data.

Backend may communicate with AI services for AI-powered recommendations.

---

## 4. High-Level Flow

Frontend
    ↓
REST API
    ↓
Backend
    ↓
Business Logic
    ↓
MySQL

Backend
    ↓
AI Service
    ↓
Recommendation
    ↓
Human Review

---

## 5. Monorepo Structure

The project uses a monorepo structure.

```text
flood-rescue/
├── apps/
│   ├── web/
│   └── api/
├── packages/
├── docs/
└── docker/
```

---

## 6. Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend
- Node.js
- TypeScript
- NestJS
- REST API

### Database
- MySQL
- Prisma ORM

### Authentication
- JWT

### Development
- Docker
- Git
- GitHub
- DBeaver

### AI
- AI API
- Human-in-the-loop decision support

---

## 7. Backend Structure

The backend uses a modular architecture.

```text
apps/api/
└── src/
    ├── auth/
    ├── users/
    ├── rescue-requests/
    ├── rescue-teams/
    ├── assignments/
    ├── vehicles/
    ├── inventory/
    ├── donations/
    ├── common/
    ├── config/
    └── main.ts
```

Each business domain is organized as a separate module.

A typical module contains:

- Controller
- Service
- Module

Request flow:

Frontend
→ Controller
→ Service
→ Business Rules
→ Prisma
→ MySQL

Controllers handle HTTP requests.

Services contain business logic.

Prisma handles database access.
