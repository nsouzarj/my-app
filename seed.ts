import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get first user 
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to seed data for.');
    return;
  }

  // Use user.id as organizationId for personal seed
  const orgId = user.id;

  // Create Default Account
  const account = await prisma.account.upsert({
    where: { id: 'default-account-id' }, // or just use create if not exist
    update: {},
    create: {
      id: 'default-account-id',
      name: 'Conta Principal',
      type: 'Checking',
      organizationId: orgId,
      balance: 0
    }
  });

  const categories = [
    { name: 'Alimentação', color: '#ef4444' },
    { name: 'Transporte', color: '#3b82f6' },
    { name: 'Lazer', color: '#f59e0b' },
    { name: 'Contas Fixas', color: '#10b981' }
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        name: cat.name,
        color: cat.color,
        organizationId: orgId
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
