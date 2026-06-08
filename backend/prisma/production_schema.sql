-- Production-Ready PostgreSQL Schema for Clinic Management System
-- Senior Database Engineer Design

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for EXCLUDE constraints on doctor_id + tstzrange

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NOSHOW');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- 3. TABLES

-- CORE: Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RBAC: Roles
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- PROFILES: Doctors
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    full_name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctor_specialties (
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    specialty_id INT REFERENCES specialties(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, specialty_id)
);

-- PROFILES: Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id), -- Optional: Guest patients might not have users
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL CHECK (date_of_birth < CURRENT_DATE),
    gender gender_type NOT NULL,
    blood_group TEXT,
    contact_number TEXT NOT NULL,
    emergency_contact TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLINICAL: Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    schedule TSTZRANGE NOT NULL, -- Range: [start, end)
    status appointment_status DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- CONSTRAINT: Prevent overlapping appointments for the same doctor
    CONSTRAINT no_overlapping_appointments 
    EXCLUDE USING GIST (doctor_id WITH =, schedule WITH &&)
    WHERE (status != 'CANCELLED')
);

-- CLINICAL: Encounters (The actual visit)
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLINICAL: Vitals
CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_pressure TEXT, -- e.g., "120/80"
    temperature_c DECIMAL(4,1),
    pulse_rate INT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLINICAL: Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,    -- e.g., "500mg"
    frequency TEXT NOT NULL, -- e.g., "Twice a day"
    duration TEXT NOT NULL,  -- e.g., "7 days"
    instructions TEXT
);

-- BILLING: Invoices
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID UNIQUE REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    status payment_status DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    service_id INT NOT NULL REFERENCES services(id),
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL, -- e.g., "CASH", "CARD", "INSURANCE"
    transaction_id TEXT UNIQUE,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXING STRATEGY

-- B-Tree for common lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status) WHERE status != 'PAID';

-- Composite Index for history retrieval (Patient medical records by date)
CREATE INDEX idx_encounters_patient_date ON encounters(patient_id, created_at DESC);

-- GIST Index for range-based queries (Finding appointments in a time frame)
-- Note: Already created by EXCLUDE constraint, but explicit indexing can help search.
-- CREATE INDEX idx_appointments_schedule ON appointments USING GIST (schedule);

-- 5. AUDIT TRIGGER (Example)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
