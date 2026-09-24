import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '../generated/prisma/client';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ListTicketQueryDto } from '../dto/list-ticket.query.dto';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: { organizationId, ...dto },
    });
  }

  findAll(organizationId: string, query: ListTicketQueryDto) {
    return this.prisma.ticket.findMany({
      where: {
        organizationId,
        ...(query.status && { status: query.status }),
        ...(query.category && { category: query.category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, organizationId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateStatus(organizationId: string, id: string, status: TicketStatus) {
    await this.findOne(organizationId, id);
    return this.prisma.ticket.update({ where: { id }, data: { status } });
  }
}