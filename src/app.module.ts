   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { PrismaModule } from './prisma/prisma.module';
    import { OrganizationModule } from './organization/organization.module';
    import { TicketModule } from './ticket/ticket.module';

   @Module({
     imports: [ConfigModule.forRoot({ isGlobal: true }), 
      PrismaModule,
      OrganizationModule,
      TicketModule,



    ],
   })
   export class AppModule {}