import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}