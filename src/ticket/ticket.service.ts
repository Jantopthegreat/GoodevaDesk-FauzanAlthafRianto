import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '../generated/prisma/client';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ListTicketQueryDto } from '../dto/list-ticket.query.dto';
import { LlmService } from '../llm/llm.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly cache: CacheService,
  ) {}

  async create(organizationId: string, dto: CreateTicketDto) {

    let result = await this.cache.getClassification(dto.subject, dto.message, organizationId);

    if (!result) {
      result = await this.llm.classify(dto.subject, dto.message);
      if (result) {
        await this.cache.setClassification(dto.subject, dto.message, organizationId, result);
      }
    }

    // 3. Simpan ticket. Kalau LLM/cache gagal total, result tetap null 

    return this.prisma.ticket.create({
      data: {
        organizationId,
        ...dto,
        category: result?.category ?? null,
        suggestedReply: result?.suggestedReply ?? null,
      },
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