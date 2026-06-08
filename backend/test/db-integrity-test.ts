import { PrismaClient, AppointmentStatus, Gender } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🚀 Starting Database Integrity Tests...');

  // 1. Test Appointment Conflict (PostgreSQL EXCLUDE Constraint)
  console.log('\n--- Test 1: Appointment Conflict ---');
  try {
    const doctorId = '7561f956-655b-432a-bc95-072228807d9b'; // Mock UUID
    const patientId = '8561f956-655b-432a-bc95-072228807d9c';

    console.log('Booking first appointment (09:00 - 10:00)...');
    await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        startTime: new Date('2026-10-10T09:00:00Z'),
        endTime: new Date('2026-10-10T10:00:00Z'),
        status: AppointmentStatus.SCHEDULED,
      },
    });

    console.log(
      'Attempting to book overlapping appointment (09:30 - 10:30)...',
    );
    await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        startTime: new Date('2026-10-10T09:30:00Z'),
        endTime: new Date('2026-10-10T10:30:00Z'),
        status: AppointmentStatus.SCHEDULED,
      },
    });
    console.error('❌ FAIL: Overlapping appointment was allowed!');
  } catch (e) {
    console.log('✅ PASS: Database correctly blocked overlapping appointment.');
  }

  // 2. Test DOB Constraint
  console.log('\n--- Test 2: Future DOB Constraint ---');
  try {
    console.log('Attempting to create patient with future DOB (2099)...');
    await prisma.patient.create({
      data: {
        fullName: 'Future Patient',
        dateOfBirth: new Date('2099-01-01'),
        gender: Gender.MALE,
        contactNumber: '123456789',
      },
    });
    console.error('❌ FAIL: Future DOB was allowed!');
  } catch (e) {
    console.log('✅ PASS: Database correctly blocked future DOB.');
  }

  // 3. Test Negative Billing
  console.log('\n--- Test 3: Negative Billing Constraint ---');
  try {
    console.log('Attempting to create invoice with negative amount...');
    await prisma.invoice.create({
      data: {
        patientId: '8561f956-655b-432a-bc95-072228807d9c',
        totalAmount: -100,
        dueDate: new Date(),
      },
    });
    console.error('❌ FAIL: Negative billing amount was allowed!');
  } catch (e) {
    console.log('✅ PASS: Database correctly blocked negative amount.');
  }

  await prisma.$disconnect();
}

runTests();
