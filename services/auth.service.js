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

    // Default Role: 'User' (id lookup)
    const defaultRole = await prisma.role.findUnique({
      where: { name: "User" },
    });
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    });
    if (!user) throw new Error("User not found");

    const { password, ...userWithoutPassword } = user;

    // Flatten permissions
    const permissions = user.role
      ? user.role.permissions.map((p) => p.slug)
      : [];

    return {
      ...userWithoutPassword,
      permissions,
    };
  }

  _generateAuthResponse(user) {
    // Flatten permissions
    const permissions = user.role
      ? user.role.permissions.map((p) => p.slug)
      : [];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role ? user.role.name : "Unknown",
        name: user.name,
        companyId: user.companyId,
      },
      config.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      permissions,
    };
  }
}

module.exports = new AuthService();
