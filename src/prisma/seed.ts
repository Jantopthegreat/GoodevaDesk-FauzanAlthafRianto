import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgs = [
    { name: 'PT Ojan Sejahtera', apiKey: '123' },
    { name: 'PT Althaf Sukses jaya xoxo', apiKey: '456' },
  ];

  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { apiKey: org.apiKey },
      update: { name: org.name },
      create: org,
    });
  }

  console.log('Seeded organizations:', orgs.map((o) => o.name).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());