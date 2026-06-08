import { PrismaClient, UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Initialize Roles & Permissions
  const permissions = ['view_patients', 'manage_appointments', 'manage_billing', 'system_admin'];
  for (const p of permissions) {
    await prisma.permission.upsert({ where: { name: p }, update: {}, create: { name: p } });
  }

  const roleConfigs = [
    { name: 'ADMIN', perms: ['system_admin'] },
    { name: 'DOCTOR', perms: ['view_patients', 'manage_appointments'] },
    { name: 'RECEPTIONIST', perms: ['view_patients', 'manage_appointments', 'manage_billing'] },
    { name: 'PATIENT', perms: [] },
  ];

  for (const r of roleConfigs) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        roleType: r.name as UserRole,
        permissions: {
          connect: r.perms.map(p => ({ name: p }))
        }
      }
    });
  }

  // 1.5. Initialize Specialties
  const specialties = ['Cardiology', 'Pediatrics', 'Dermatology', 'Internal Medicine', 'Neurology', 'Orthopedics'];
  for (const s of specialties) {
    await prisma.specialty.upsert({
      where: { name: s },
      update: {},
      create: { name: s },
    });
  }

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      email: 'admin@clinic.com',
      passwordHash: hashedPassword,
      roles: { connect: { name: 'ADMIN' } },
    },
  });

  // 3. Create a Doctor
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@clinic.com' },
    update: {},
    create: {
      email: 'doctor@clinic.com',
      passwordHash: hashedPassword,
      roles: { connect: { name: 'DOCTOR' } },
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      fullName: 'Dr. Smith',
      licenseNumber: 'LIC12345',
      specialties: {
        connect: { name: 'Cardiology' }
      }
    },
  });

  // 4. Create a Receptionist
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@clinic.com' },
    update: {},
    create: {
      email: 'reception@clinic.com',
      passwordHash: hashedPassword,
      roles: { connect: { name: 'RECEPTIONIST' } },
    },
  });

  // 5. Create a Patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@clinic.com' },
    update: {},
    create: {
      email: 'patient@clinic.com',
      passwordHash: hashedPassword,
      roles: { connect: { name: 'PATIENT' } },
    },
  });

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
      gender: Gender.MALE,
      contactNumber: '1234567890',
      bloodGroup: 'O+',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
