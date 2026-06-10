# Clinic Management System (نظام إدارة العيادات الطبية)

A premium, production-ready **Clinic Management System** built with a modern, high-performance tech stack. This system features full Role-Based Access Control (RBAC) supporting **Admins, Doctors, Receptionists, and Patients**, comprehensive billing, medical record management, and an interactive frontend with Arabic localization.

---

## 🚀 Key Features

### 👤 Role-Based Access Control (RBAC)
- **Admin**: Full system configurations, service management, analytics reports, doctor onboarding, and clinic settings.
- **Doctor**: Manage queue, view/update patient medical files, write prescriptions, and define working schedules.
- **Receptionist**: Register new patients, book and manage appointments, and issue/collect invoice payments.
- **Patient**: Register accounts, view appointment history, book new appointments, and view clinical prescriptions.

### 📅 Appointment Scheduling
- Dynamic booking system that prevents schedule conflicts using database exclusions.
- Full calendar view with calendar state progression (Scheduled, Checked-In, In Progress, Completed, Cancelled, No-Show).

### 🧾 Billing & Invoicing
- Direct service-based invoicing on completion of patient encounters.
- Support for VAT calculations, payment receipts, cash collection, and CSV export of financial reports.

### 🩺 Electronic Medical Records (EMR)
- Encounter reporting with vitals (blood pressure, temperature, heart rate, weight/height).
- Prescription generation with drug dosage, frequency, and instructions.
- Patient file asset attachments.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **NestJS (Node.js)** | Progressive Node.js framework for scalable API design. |
| **Database** | **PostgreSQL** | Relational database with advanced integrity constraints. |
| **ORM** | **Prisma** | Modern database client and schema migration tool. |
| **Frontend** | **Next.js 16 (React 19)** | App Router, Turbopack, tailwindcss for styling, and framer-motion for micro-animations. |
| **State & API** | **Zustand & React Query** | Optimized client-side state and caching. |
| **CI/CD** | **GitHub Actions** | Automated testing, docker builds, and image registry pushes. |

---

## 📂 Project Structure

```text
├── .github/workflows/    # CI/CD pipelines
├── backend/              # NestJS Web API
│   ├── src/              # Application modules (auth, users, patients, billing, etc.)
│   ├── prisma/           # Database schema, migrations, and seed scripts
│   ├── test/             # E2E & Integration tests
│   └── Dockerfile        # Production Docker configuration
├── frontend/             # Next.js App Router SPA
│   ├── src/
│   │   ├── app/          # Pages (admin, doctor, receptionist, patient, settings)
│   │   ├── components/   # UI components & Dashboards
│   │   ├── lib/          # API client (axios interceptors)
│   │   └── store/        # Auth state (Zustand)
│   └── Dockerfile        # Production Docker configuration
└── docker-compose.yml    # Main Docker Compose orchestration file
```

---

## ⚙️ Local Development Quick Start

### Prerequisites
- [Node.js v20+](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/)

### Step 1: Clone and Set Up Databases
Start a local PostgreSQL database container:
```bash
docker compose up db -d
```

### Step 2: Run Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and run migrations:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Start backend in development mode:
   ```bash
   npm run start:dev
   ```
   *The backend will be available at `http://localhost:3001`.*

### Step 3: Run Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start frontend in development mode:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 🧪 Running Tests
To run unit and integration tests:

### Backend
```bash
cd backend
npm run test       # Unit tests
npm run test:e2e   # E2E / Integration tests
```

### Frontend
```bash
cd frontend
npm run lint       # Run ESLint validation
npm run build      # Test compilation
```

---

## 📖 Additional Documentation
- [Architecture Documentation](file:///ARCHITECTURE.md) - Database design, patterns, and structure.
- [API Documentation](file:///API_DOCUMENTATION.md) - Endpoints list, authentication, and payloads.
- [Deployment Guide](file:///DEPLOYMENT_GUIDE.md) - Production Docker deployment.
