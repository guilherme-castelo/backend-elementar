const usersRepository = require("../repositories/users.repository");
const bcrypt = require("bcryptjs");
const { NotFoundError, ConflictError } = require("../errors/AppError");
const rolesService = require("./roles.service");

class UsersService {
  async getAll() {
    const users = await usersRepository.getAll();
    return users.map((u) => this._formatUserResponse(u));
  }

  async getById(id) {
    const user = await usersRepository.getById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return this._formatUserResponse(user);
  }

  async findByEmail(email) {
    const user = await usersRepository.findByEmail(email);
    if (!user) return null;
    return user;
  }

  async create(data) {
    // Check for existing email
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("Email already exists");
    }

    const payload = { ...data };

    // Hash password
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    // Safety checks / Casting
    if (payload.companyId) payload.companyId = parseInt(payload.companyId);

    // Default Preferences if not provided or empty
    if (!payload.preferences) {
      payload.preferences = JSON.stringify({
        language: { code: "pt", name: "Portuguese (Brazil)" },
        dateFormat: "DD/MM/YYYY",
        automaticTimeZone: { name: "GMT-03:00", isEnabled: true },
      });
    } else if (typeof payload.preferences === "object") {
      payload.preferences = JSON.stringify(payload.preferences);
    }

    if (typeof payload.address === "object")
      payload.address = JSON.stringify(payload.address);
    if (Array.isArray(payload.roles)) payload.roles = payload.roles.join(",");

    const user = await usersRepository.create(payload);

    // Initial Membership Creation
    if (payload.companyId) {
      // Logic for Role ID: If payload has roleId (legacy) or payload.roles (string array?), use it.
      // Payload might come from Auth Service register which assumes logic.
      // We will look for payload.roleId (integer).
      let roleId = payload.roleId ? parseInt(payload.roleId) : null;

      // If no roleId, we try to find default "User" role for now to maintain behavior?
      // Or we rely on caller toprovide it.
      // Let's rely on caller.

      if (roleId) {
        // Validate Scope
        const isValid = await rolesService.validateScope(
          roleId,
          payload.companyId
        );
        if (!isValid) {
          // We created the user... rollback? Ideally this should be a transaction.
          // Since repository.create is not transactional here, we might have inconsistency if we fail now.
          // But removing user is easy.
          await usersRepository.delete(user.id);
          throw new Error("Role is not valid for this company scope.");
        }

        const prisma = require("../utils/prisma");
        await prisma.userMembership.create({
          data: {
            userId: user.id,
            companyId: parseInt(payload.companyId),
            roleId: roleId,
            isActive: true,
          },
        });
      }
    }

    return this._formatUserResponse(user);
  }

  async update(id, data) {
    // Check existence
    await this.getById(id); // throws NotFound

    const payload = { ...data };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.companyId) payload.companyId = parseInt(payload.companyId);

    if (typeof payload.preferences === "object")
      payload.preferences = JSON.stringify(payload.preferences);
    if (typeof payload.address === "object")
      payload.address = JSON.stringify(payload.address);
    if (Array.isArray(payload.roles)) payload.roles = payload.roles.join(",");

    const user = await usersRepository.update(id, payload);
    return this._formatUserResponse(user);
  }

  async delete(id) {
    // check existence
    await this.getById(id);
    return usersRepository.delete(id);
  }

  // Helper to strip password and normalize fields
  _formatUserResponse(user) {
    const { password, ...rest } = user;
    return rest;
  }
}

module.exports = new UsersService();
