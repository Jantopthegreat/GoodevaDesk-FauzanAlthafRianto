import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateApiKey(apiKey: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { apiKey },
    });
    if (!organization) throw new UnauthorizedException('Invalid API key');
    return organization;
  }
}