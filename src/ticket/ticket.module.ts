import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [OrganizationModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}