const companyRepository = require("../repositories/companies.repository");
const { NotFoundError } = require("../errors/AppError");
const prisma = require("../utils/prisma");

class CompanyService {
  async getAll() {
    return companyRepository.getAll();
  }

  async getById(id) {
    const company = await companyRepository.getById(id);
    if (!company) throw new NotFoundError("Company not found");
    return company;
  }

  async create(data) {
    const { managerId, ...rest } = data;
    const { getStore } = require("../utils/context");
    const store = getStore();

    // Create company first
    const company = await companyRepository.create(rest);

    // If managerId defined (explicitly), assign it
    if (managerId) {
      await this.assignManager(company.id, managerId);
    }
    // Onboarding Case: No managerId provided but user is in context without company
    else if (store && store.userId && !store.companyId) {
      // Check if this is their first company to avoid hijacking other flows
      const membershipsCount = await prisma.userMembership.count({
        where: { userId: store.userId },
      });

      if (membershipsCount === 0) {
        await this.assignManager(company.id, store.userId, "Admin");
      }
    }

    return company;
  }

  async update(id, data) {
    await this.getById(id); // check existence
    const { managerId, ...rest } = data;

    const company = await companyRepository.update(id, rest);

    if (managerId) {
      await this.assignManager(id, managerId);
    }

    return company;
  }

  async delete(id) {
    await this.getById(id); // check existence
    return companyRepository.delete(id);
  }

  async assignManager(companyId, userId, roleName = "Manager") {
    // 1. Update company manager
    await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: { managerId: parseInt(userId) },
    });

    // 2. Ensure UserMembership exists
    // Find role by name
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    const roleId = role ? role.id : 1; // Fallback to id 1 (assumed Admin/default) if not found

    await prisma.userMembership.upsert({
      where: {
        userId_companyId: {
          userId: parseInt(userId),
          companyId: parseInt(companyId),
        },
      },
      update: {
        roleId: roleId,
        isActive: true,
      },
      create: {
        userId: parseInt(userId),
        companyId: parseInt(companyId),
        roleId: roleId,
        isActive: true,
      },
    });
  }
}

module.exports = new CompanyService();
