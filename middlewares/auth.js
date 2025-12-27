const jwt = require("jsonwebtoken");
const config = require("../config/config");

const authGuard = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Fetch full user permissions from DB to ensure validity/revocation
    // Using prisma import here (require it at top)
    const prisma = require("../utils/prisma");

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive)
      return res.status(403).json({ message: "User is inactive" });
    if (user.company && !user.company.isActive && user.role.name !== "Admin") {
      // Optional: Block access if company is inactive (except System Admin)
      // Checking if user has company loaded. Prisma findUnique above didn't load company.
      // Let's rely on individual services for company status if dealing with company data.
      // Or load it here.
    }

    // Flatten permissions for easy check
    const permissions = user.role
      ? user.role.permissions.map((p) => p.slug)
      : [];

    req.user = {
      ...user,
      permissions: permissions,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authGuard;
