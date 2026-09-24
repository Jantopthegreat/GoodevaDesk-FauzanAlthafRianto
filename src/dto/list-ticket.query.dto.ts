import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { TicketStatus } from '../generated/prisma/client';

export class ListTicketQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsIn(['billing', 'technical', 'general'])
  category?: string;
}