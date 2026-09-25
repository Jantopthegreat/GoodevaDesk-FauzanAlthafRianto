import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { CacheModule } from '../cache/cache.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [OrganizationModule, CacheModule, LlmModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}