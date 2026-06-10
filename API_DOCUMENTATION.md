# Clinic Management System - API Documentation

The backend API is designed as a RESTful interface using JSON for payload exchange.

## 🌐 Base URL
- **Local Development**: `http://localhost:3001`
- **Production**: Hostname configured in your environment variable `NEXT_PUBLIC_API_URL`.

---

## 🔒 Authentication & Headers

Protected endpoints require a JWT bearer token to be sent in the request header:
```http
Authorization: Bearer <your_access_token>
```

---

## 🔑 Authentication Module (`/auth`)

### 1. Register User (Patient)
Creates a new patient account and automatically logs them in.
- **URL**: `/auth/register`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "email": "patient@clinic.com",
    "password": "password123",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "contactNumber": "01012345678",
    "bloodGroup": "O+",
    "address": "Cairo, Egypt"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "dGhpcy1pcy...",
    "user": {
      "id": "e305e94b-...",
      "email": "patient@clinic.com",
      "roles": ["PATIENT"]
    }
  }
  ```

### 2. Login User
Authenticates a user and returns authorization tokens.
- **URL**: `/auth/login`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "email": "admin@clinic.com",
    "password": "admin123"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "dGhpcy1pcy...",
    "user": {
      "id": "b105a94b-...",
      "email": "admin@clinic.com",
      "roles": ["ADMIN"]
    }
  }
  ```

### 3. Refresh Access Token
Obtains a new access token using a valid refresh token.
- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "userId": "b105a94b-...",
    "refreshToken": "dGhpcy1pcy..."
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "dGhpcy1pcy..."
  }
  ```

---

## 👥 Users Profile (`/users`)

### 1. Get Current User Profile
Retrieves detailed information and roles of the authenticated user.
- **URL**: `/users/profile`
- **Method**: `GET`
- **Response (`200 OK`)**:
  ```json
  {
    "id": "e305e94b-...",
    "email": "patient@clinic.com",
    "fullName": "John Doe",
    "roles": ["PATIENT"]
  }
  ```

---

## 🩺 Patients Module (`/patients`)

### 1. Get Patients List
- **URL**: `/patients`
- **Method**: `GET`
- **Access Roles**: `ADMIN`, `DOCTOR`, `RECEPTIONIST`
- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": "c161f956-...",
      "fullName": "John Doe",
      "contactNumber": "01012345678",
      "gender": "MALE",
      "dateOfBirth": "1990-01-01T00:00:00.000Z"
    }
  ]
  ```

### 2. Create Patient Record (Manual Registration)
- **URL**: `/patients`
- **Method**: `POST`
- **Access Roles**: `ADMIN`, `RECEPTIONIST`
- **Payload**:
  ```json
  {
    "fullName": "Jane Doe",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "gender": "FEMALE",
    "contactNumber": "01287654321",
    "address": "Giza, Egypt"
  }
  ```

---

## 📅 Appointments Module (`/appointments`)

### 1. Create Appointment
Books a new slot. Will fail if there is an overlapping slot for the selected doctor.
- **URL**: `/appointments`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "doctorId": "d505e94b-...",
    "patientId": "c161f956-...",
    "startTime": "2026-10-10T09:00:00.000Z",
    "endTime": "2026-10-10T10:00:00.000Z",
    "notes": "Regular checkup"
  }
  ```

### 2. Update Appointment Status
Changes status of the appointment.
- **URL**: `/appointments/:id/status`
- **Method**: `PATCH`
- **Payload**:
  ```json
  {
    "status": "CHECKED_IN"
  }
  ```
  *(Status options: `SCHEDULED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NOSHOW`)*

---

## 🧾 Billing Module (`/billing`)

### 1. Get Invoices List
- **URL**: `/billing/invoices`
- **Method**: `GET`
- **Access Roles**: `ADMIN`, `RECEPTIONIST`

### 2. Create Invoice Manual
- **URL**: `/billing/invoices`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "patientId": "c161f956-...",
    "dueDate": "2026-10-17T00:00:00.000Z",
    "items": [
      {
        "serviceId": 1,
        "quantity": 1,
        "unitPrice": 150
      }
    ]
  }
  ```

### 3. Record Payment (Collect cash)
- **URL**: `/billing/payments`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "invoiceId": "i705e94b-...",
    "amount": 150,
    "method": "CASH"
  }
  ```

### 4. Export Financial Report
- **URL**: `/billing/export/csv`
- **Method**: `GET`
- **Response**: A file download attachment in CSV format.
