const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

class AuthService {
  async register(data) {
    const { name, email, password, companyId } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default connection to company 1 if not provided, or handle creation logic
    // For MVP, if companyId is provided use it, else generic.
    // Logic from previous controller: companyId || 1

    // Create User
    // Default Role: 'User' (id lookup)
    const defaultRole = await prisma.role.findUnique({
      where: { name: "User" },
    });

    // Fallback if seed failed or role missing
    const roleId = defaultRole ? defaultRole.id : undefined;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyId: companyId ? parseInt(companyId) : 1,
        roleId: roleId,
        preferences: JSON.stringify({
          language: { code: "pt", name: "Portuguese (Brazil)" },
          dateFormat: "DD/MM/YYYY",
          automaticTimeZone: { name: "GMT-03:00", isEnabled: true },
        }),
      },
      include: { role: { include: { permissions: true } } },
    });

    return this._generateAuthResponse(user);
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("User is inactive");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    return this._generateAuthResponse(user);
  }

  async me(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  _generateAuthResponse(user) {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: user.roles,
        name: user.name,
        companyId: user.companyId,
      },
      config.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    // Permissions logic
    // We used to fetch from 'roles' table.
    // Now roles is a string in User. Using simple mapping for MVP.
    // If 'admin' -> all permissions. If 'user' -> basic.
    const permissions = this._getPermissionsForRole(user.roles);

    return {
      user: userWithoutPassword,
      token,
      permissions,
    };
  }

  _getPermissionsForRole(role) {
    // Hardcoded map or fetch from DB if we had Role model.
    // Using simple switch for Refactor MVP as per Schema decision (String role).
    const allPermissions = [
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "companies:manage",
      "employees:read",
      "employees:create",
      "employees:update",
      "employees:delete",
      "meals:read",
      "meals:register",
      "meals:reports",
      "meals:delete",
    ];

    const userPermissions = ["users:read", "employees:read", "meals:read"];

    if (role.includes("admin")) return allPermissions;
    return userPermissions;
  }
}

module.exports = new AuthService();
