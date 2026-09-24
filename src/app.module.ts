   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { PrismaModule } from './prisma/prisma.module';
    import { OrganizationModule } from './organization/organization.module';

   @Module({
     imports: [ConfigModule.forRoot({ isGlobal: true }), 
      PrismaModule,
      OrganizationModule,


    ],
   })
   export class AppModule {}