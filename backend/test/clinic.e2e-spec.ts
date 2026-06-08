import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Clinic System Integration (E2E)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authToken: string;
  let testUserEmail = `test-integration-${Date.now()}@clinic.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Clean up test user
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
      include: { patient: true }
    });

    if (user) {
      if (user.patient) {
        await prisma.patient.delete({ where: { id: user.patient.id } });
      }
      await prisma.user.delete({ where: { id: user.id } });
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('1. Guest - Block unauthorized access to profile', () => {
    return request(app.getHttpServer())
      .get('/users/profile')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('2. Register - Create a new patient account', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUserEmail,
        password: 'password123',
        fullName: 'Integration Test Patient',
        dateOfBirth: '1995-05-15',
        gender: 'MALE',
        contactNumber: '1112223333'
      })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.email).toBe(testUserEmail);
      });
  });

  it('3. Auth - Log in and retrieve JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserEmail,
        password: 'password123'
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('accessToken');
    authToken = res.body.accessToken;
  });

  it('4. Profile - Retrieve authenticated user profile details', () => {
    return request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.email).toBe(testUserEmail);
        expect(res.body.fullName).toBe('Integration Test Patient');
        expect(res.body.roles).toContain('PATIENT');
      });
  });

  it('5. Billing - Block payment execution with empty parameters', () => {
    return request(app.getHttpServer())
      .post('/billing/payments/bulk')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        invoiceIds: [],
        method: 'CARD'
      })
      .expect(HttpStatus.CONFLICT); // Validation checks throw ConflictException on empty array
  });
});
