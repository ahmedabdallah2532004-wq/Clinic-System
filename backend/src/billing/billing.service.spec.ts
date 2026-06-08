import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

describe('BillingService', () => {
  let service: BillingService;

  const mockPrisma = {
    invoice: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    // Mock $transaction to run the transaction callback inline with the mockPrisma client
    $transaction: jest.fn(async (cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPayment', () => {
    it('should throw ConflictException if payment amount is zero or negative', async () => {
      await expect(service.addPayment('inv-1', 0, 'CARD')).rejects.toThrow(ConflictException);
      await expect(service.addPayment('inv-1', -10, 'CARD')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if invoice is not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.addPayment('inv-1', 100, 'CARD')).rejects.toThrow(NotFoundException);
    });

    it('should successfully add a payment and update status if fully paid', async () => {
      const invoice = {
        id: 'inv-1',
        totalAmount: 100,
        payments: [{ amount: 50 }],
        status: PaymentStatus.PENDING,
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(invoice);
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1', amount: 50 });

      const result = await service.addPayment('inv-1', 50, 'CARD');
      expect(result).toBeDefined();
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: PaymentStatus.PAID },
      });
    });
  });

  describe('addBulkPayments', () => {
    it('should throw ConflictException if invoice ID list is empty', async () => {
      await expect(service.addBulkPayments({ invoiceIds: [], method: 'CARD' })).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if any of the bulk invoices is missing', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.addBulkPayments({ invoiceIds: ['missing-inv'], method: 'CARD' })).rejects.toThrow(NotFoundException);
    });

    it('should process bulk payments successfully, skipping already paid invoices', async () => {
      const invoicePending = {
        id: 'inv-pending',
        totalAmount: 150,
        payments: [],
        status: PaymentStatus.PENDING,
      };
      const invoiceAlreadyPaid = {
        id: 'inv-paid',
        totalAmount: 100,
        payments: [],
        status: PaymentStatus.PAID,
      };

      mockPrisma.invoice.findUnique
        .mockResolvedValueOnce(invoicePending)
        .mockResolvedValueOnce(invoiceAlreadyPaid);

      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-bulk-1', amount: 150 });

      const result = await service.addBulkPayments({
        invoiceIds: ['inv-pending', 'inv-paid'],
        method: 'CARD',
      });

      expect(result).toHaveLength(1); // Only paid the pending one
      expect(mockPrisma.payment.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.invoice.update).toHaveBeenCalledTimes(1);
    });
  });
});

