import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  const doctors = await prisma.doctor.findMany();
  const patients = await prisma.patient.findMany();
  console.log({ users: users.length, doctors: doctors.length, patients: patients.length });
}
main().finally(() => prisma.$disconnect());
