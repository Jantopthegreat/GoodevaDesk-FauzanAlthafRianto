import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guards';
import { CurrentOrg } from '../common/decorators/current-org.decorators';
import type { Organization } from '../generated/prisma/client';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ListTicketQueryDto } from '../dto/list-ticket.query.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

@UseGuards(ApiKeyGuard)
@Controller('tickets')
export class TicketController {
  constructor(private readonly tickets: TicketService) {}

  @Post()
  create(@CurrentOrg() org: Organization, @Body() dto: CreateTicketDto) {
    return this.tickets.create(org.id, dto);
  }

  @Get()
  findAll(@CurrentOrg() org: Organization, @Query() query: ListTicketQueryDto) {
    return this.tickets.findAll(org.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentOrg() org: Organization,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tickets.findOne(org.id, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentOrg() org: Organization,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.tickets.updateStatus(org.id, id, dto.status);
  }
}