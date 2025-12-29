const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- ROLES & PERMISSIONS ---");
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        select: { slug: true },
      },
    },
  });
  roles.forEach((r) => {
    console.log(`Role: ${r.name}`);
    console.log(`Permissions: ${r.permissions.map((p) => p.slug).join(", ")}`);
    console.log("---");
  });

  console.log("\n--- USERS ---");
  const users = await prisma.user.findMany({
    include: {
      role: {
        select: { name: true },
      },
    },
  });
  users.forEach((u) => {
    console.log(`User: ${u.email} | Role: ${u.role ? u.role.name : "NONE"}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
