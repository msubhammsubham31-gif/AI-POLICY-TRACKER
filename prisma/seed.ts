// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Apex Industrial Systems dataset...');
  // Apex Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-apex-001' },
    update: {},
    create: {
      id: 'org-apex-001',
      name: 'Apex Industrial Systems Corp.',
      industry: 'Heavy Manufacturing, Advanced Materials & Specialty Chemicals',
      countries: ['DE', 'US', 'BE', 'JP']
    }
  });
  console.log(`Organization ensured: ${org.name}`);
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.warn('Prisma seed notice:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
