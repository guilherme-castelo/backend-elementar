const prisma = require("../utils/prisma");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Mock Email Service
const sendEmail = async (to, subject, text) => {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
};

exports.create = async (companyId, { email, roleId }) => {
  // Check if email already exists as a user (global check?)
  // For MVP SaaS, email should be unique globally or per company.
  // Schema has 'email' unique on User.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const invitation = await prisma.invitation.create({
    data: {
      email,
      roleId,
      companyId,
      token,
      expiresAt,
    },
  });

  // Send Email
  const inviteLink = `http://localhost:3333/setup-password?token=${token}`;
  await sendEmail(
    email,
    "Convite para Elementar",
    `Você foi convidado! Complete seu cadastro aqui: ${inviteLink}`
  );

  return invitation;
};

exports.validateToken = async (token) => {
  const invite = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invite) throw new Error("Invalid token");
  if (invite.expiresAt < new Date()) throw new Error("Token expired");

  return invite;
};

exports.accept = async (token, { name, password }) => {
  const invite = await this.validateToken(token);

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User transactionally (delete invite, create user)
  const user = await prisma.$transaction(async (tx) => {
    // Create User
    const newUser = await tx.user.create({
      data: {
        email: invite.email,
        name,
        password: hashedPassword,
        companyId: invite.companyId,
        roleId: invite.roleId,
        isActive: true,
      },
    });

    // Delete Invitation
    await tx.invitation.delete({ where: { id: invite.id } });

    return newUser;
  });

  return user;
};
