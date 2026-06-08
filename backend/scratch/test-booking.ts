import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function stressTest() {
  console.log('--- Starting Double-Booking Stress Test ---');

  const doctor = await prisma.doctor.findFirst();
  let patient = await prisma.patient.findFirst();

  if (!doctor) {
    console.error('No doctor found. Run npx prisma db seed first.');
    return;
  }

  if (!patient) {
    console.log('No patient found. Creating a test patient...');
    const patientUser = await prisma.user.create({
      data: {
        email: `testpatient_${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        roles: {
          connect: [{ name: 'PATIENT' }]
        },
      }
    });
    patient = await prisma.patient.create({
      data: {
        userId: patientUser.id,
        fullName: 'Test Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        contactNumber: '123456789'
      }
    });
  }

  const startTime = new Date('2026-06-01T10:00:00Z');
  const endTime = new Date('2026-06-01T11:00:00Z');

  console.log(`Attempting to book overlapping slots for Dr. ${doctor.fullName}...`);

  // Attempt 1: Success
  try {
    await prisma.appointment.deleteMany({ where: { startTime } }); // Cleanup
    const app1 = await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        startTime,
        endTime,
      }
    });
    console.log('✅ First appointment created successfully.');
  } catch (e: any) {
    console.error('❌ First appointment failed:', e.message);
  }

  // Attempt 2: Should fail due to UNIQUE constraint
  try {
    await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        startTime, // Same start time
        endTime: new Date('2026-06-01T11:30:00Z'),
      }
    });
    console.log('❌ ERROR: Second appointment was created! UNIQUE constraint failed.');
  } catch (e: any) {
    if (e.code === 'P2002') {
      console.log('✅ Success: Database UNIQUE constraint blocked the double booking.');
    } else {
      console.error('❌ Unexpected error:', e.message);
    }
  }

  console.log('--- Stress Test Finished ---');
}

stressTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
