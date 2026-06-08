import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const p = this.prisma as any;
    const settings = await p.clinicSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      const newSettings = await p.clinicSetting.create({
        data: { id: 'default', clinicName: 'عيادة نُخبة الطبي' },
      });
      return {
        id: newSettings.id,
        clinicName: newSettings.clinicName,
        clinicLogo: newSettings.logoUrl,
        phone: newSettings.clinicPhone,
        email: newSettings.clinicEmail,
        address: newSettings.clinicAddress,
        vatPercentage: newSettings.vatPercentage,
      };
    }

    return {
      id: settings.id,
      clinicName: settings.clinicName,
      clinicLogo: settings.logoUrl,
      phone: settings.clinicPhone,
      email: settings.clinicEmail,
      address: settings.clinicAddress,
      vatPercentage: settings.vatPercentage,
    };
  }

  async updateSettings(data: any) {
    const p = this.prisma as any;
    const current = await p.clinicSetting.findUnique({
      where: { id: 'default' },
    });

    const clinicName =
      data.clinicName !== undefined
        ? data.clinicName
        : current?.clinicName || 'عيادة نُخبة الطبي';
    const logoUrl =
      data.clinicLogo !== undefined ? data.clinicLogo : current?.logoUrl;
    const clinicPhone =
      data.phone !== undefined ? data.phone : current?.clinicPhone;
    const clinicEmail =
      data.email !== undefined ? data.email : current?.clinicEmail;
    const clinicAddress =
      data.address !== undefined ? data.address : current?.clinicAddress;
    const vatPercentage =
      data.vatPercentage !== undefined
        ? Number(data.vatPercentage)
        : current?.vatPercentage || 15;

    const updated = await p.clinicSetting.upsert({
      where: { id: 'default' },
      update: {
        clinicName,
        logoUrl,
        clinicPhone,
        clinicEmail,
        clinicAddress,
        vatPercentage,
      },
      create: {
        id: 'default',
        clinicName,
        logoUrl,
        clinicPhone,
        clinicEmail,
        clinicAddress,
        vatPercentage,
      },
    });

    return {
      id: updated.id,
      clinicName: updated.clinicName,
      clinicLogo: updated.logoUrl,
      phone: updated.clinicPhone,
      email: updated.clinicEmail,
      address: updated.clinicAddress,
      vatPercentage: updated.vatPercentage,
    };
  }
}
