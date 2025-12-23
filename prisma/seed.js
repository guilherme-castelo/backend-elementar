require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create Company
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Brasil Auto Serviço de Produtos Alimenticios SA',
      cnpj: '10964693000196'
    }
  });

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.test' },
    update: {},
    create: {
      email: 'admin@empresa.test',
      name: 'Admin',
      password: adminPassword,
      companyId: company.id,
      roles: 'admin',
      jobTitle: 'Administrator',
      bio: 'System Administrator',
      preferences: JSON.stringify({
        language: { code: 'pt', name: 'Portuguese (Brazil)' },
        dateFormat: 'DD/MM/YYYY',
        automaticTimeZone: { name: 'GMT-03:00', isEnabled: true }
      })
    }
  });

  // Create Standard User
  const userPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@empresa.test' },
    update: {},
    create: {
      email: 'user@empresa.test',
      name: 'User',
      password: userPassword,
      companyId: company.id,
      roles: 'user',
      jobTitle: 'Employee',
      preferences: JSON.stringify({
        language: { code: 'pt', name: 'Portuguese (Brazil)' },
        dateFormat: 'DD/MM/YYYY',
        automaticTimeZone: { name: 'GMT-03:00', isEnabled: true }
      })
    }
  });

  console.log({ company, admin, user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
