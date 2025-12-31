const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Features & Permissions
  // Definition of Features and their permissions
  const features = [
    {
      name: "Gestão de Empresas",
      slug: "companies",
      permissions: [
        { name: "Criar Empresa", slug: "company:create" },
        { name: "Ler Empresa", slug: "company:read" },
        { name: "Atualizar Empresa", slug: "company:update" },
        { name: "Deletar Empresa", slug: "company:delete" },
        { name: "Inativar Empresa", slug: "company:inactivate" },
      ],
    },
    {
      name: "Gestão de Usuários",
      slug: "users",
      permissions: [
        { name: "Criar Usuário", slug: "user:create" },
        { name: "Ler Usuário", slug: "user:read" },
        { name: "Atualizar Usuário", slug: "user:update" },
        { name: "Deletar Usuário", slug: "user:delete" },
        { name: "Inativar Usuário", slug: "user:inactivate" },
      ],
    },
    {
      name: "Gestão de Funcionários",
      slug: "employees",
      permissions: [
        { name: "Criar Funcionário", slug: "employee:create" },
        { name: "Ler Funcionário", slug: "employee:read" },
        { name: "Atualizar Funcionário", slug: "employee:update" },
        { name: "Deletar Funcionário", slug: "employee:delete" },
      ],
    },
    {
      name: "Gestão de Refeições",
      slug: "meals",
      permissions: [
        { name: "Registrar Refeição", slug: "meal:create" },
        { name: "Ler Refeição", slug: "meal:read" },
        { name: "Atualizar Refeição", slug: "meal:update" },
        { name: "Deletar Refeição", slug: "meal:delete" },
      ],
    },
    {
      name: "Tarefas",
      slug: "tasks",
      permissions: [
        { name: "Criar Tarefa", slug: "task:create" },
        { name: "Ler Tarefa", slug: "task:read" },
        { name: "Atualizar Tarefa", slug: "task:update" },
        { name: "Deletar Tarefa", slug: "task:delete" },
      ],
    },
    {
      name: "Configurações de Acesso",
      slug: "access_control",
      permissions: [
        { name: "Gerenciar Features", slug: "feature:manage" },
        { name: "Gerenciar Permissões", slug: "permission:manage" },
        { name: "Gerenciar Perfis", slug: "role:manage" },
      ],
    },
    {
      name: "Integrações",
      slug: "integrations",
      permissions: [
        { name: "Integração Domínio", slug: "integration:dominio" },
      ],
    },
    {
      name: "Chat / Mensagens",
      slug: "chat",
      permissions: [
        { name: "Acessar Chat", slug: "chat:read" },
        { name: "Enviar Mensagem", slug: "chat:write" },
        { name: "Deletar Mensagem", slug: "chat:delete" },
      ],
    },
  ];

  for (const feat of features) {
    const feature = await prisma.feature.upsert({
      where: { slug: feat.slug },
      update: {},
      create: {
        name: feat.name,
        slug: feat.slug,
        description: `Módulo de ${feat.name}`,
      },
    });

    for (const perm of feat.permissions) {
      await prisma.permission.upsert({
        where: { slug: perm.slug },
        update: { featureId: feature.id },
        create: {
          name: perm.name,
          slug: perm.slug,
          featureId: feature.id,
        },
      });
    }
  }

  // 2. Create Roles
  const allPermissions = await prisma.permission.findMany();

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {
      permissions: {
        set: allPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: "Admin",
      description: "Acesso total ao sistema",
      permissions: {
        connect: allPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // User Role (Basic access)
  // Filter permissions for basic user
  const basicSlugs = [
    "task:create",
    "task:read",
    "task:update",
    "meal:read",
    "user:read",
    "employee:read",
    "chat:read",
    "chat:write",
    "chat:delete",
  ];
  const basicPermissions = allPermissions.filter((p) =>
    basicSlugs.includes(p.slug)
  );

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {
      permissions: {
        set: basicPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: "User",
      description: "Usuário padrão do sistema",
      permissions: {
        connect: basicPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Manage Role (HR Manager)
  const managerSlugs = [
    ...basicSlugs,
    "employee:create",
    "employee:update",
    "meal:create",
    "meal:delete",
    "meal:update",
    "integration:dominio",
  ];
  const managerPermissions = allPermissions.filter((p) =>
    managerSlugs.includes(p.slug)
  );

  await prisma.role.upsert({
    where: { name: "Manager" },
    update: {
      permissions: {
        set: managerPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: "Manager",
      description: "Gestor de RH e Operações",
      permissions: {
        connect: managerPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // 3. Create Default Group & Company
  const group = await prisma.group.upsert({
    where: { slug: "elementar-hq" },
    update: {},
    create: {
      name: "Grupo Elementar",
      slug: "elementar-hq",
    },
  });

  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: { groupId: group.id, type: "MATRIZ" },
    create: {
      name: "Elementar Corp",
      cnpj: "00.000.000/0001-00",
      groupId: group.id,
      type: "MATRIZ",
    },
  });

  const hashedPassword = await bcrypt.hash("admin", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@empresa.test" },
    update: {
      roleId: adminRole.id,
      companyId: company.id,
      password: hashedPassword,
    },
    create: {
      name: "Administrador",
      email: "admin@empresa.test",
      password: hashedPassword,
      companyId: company.id,
      roleId: adminRole.id,
    },
  });

  // 4. Create Memberships
  await prisma.userMembership.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company.id,
      },
    },
    update: {
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      userId: adminUser.id,
      companyId: company.id,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Create a second test company for verification
  const company2 = await prisma.company.upsert({
    where: { id: 2 },
    update: { groupId: group.id, type: "FILIAL" },
    create: {
      name: "Elementar Filial SP",
      cnpj: "00.000.000/0002-00",
      groupId: group.id,
      type: "FILIAL",
    },
  });

  // Give Admin access to second company as well (as Manager role there for testing)
  await prisma.userMembership.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company2.id,
      },
    },
    update: {
      roleId: adminRole.id, // Using Admin role here too for simplicity
      isActive: true,
    },
    create: {
      userId: adminUser.id,
      companyId: company2.id,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // 5. Assign Manager & Role Scopes
  // Make Admin user the manager of Company 1
  await prisma.company.update({
    where: { id: company.id },
    data: {
      managerId: adminUser.id,
    },
  });

  // Scope Admin Role to both companies
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      companies: {
        connect: [{ id: company.id }, { id: company2.id }],
      },
    },
  });

  // Scope User Role to Company 1 only
  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      companies: {
        connect: [{ id: company.id }],
      },
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
