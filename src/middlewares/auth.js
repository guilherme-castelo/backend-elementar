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

    // Initialize Request Context
    let contextCompanyId = null;
    const headerCompanyId = req.headers["x-company-id"];

    if (headerCompanyId) {
      // New Logic: Check Membership
      // We need to use prisma.userMembership. But prisma is not imported directly as `prisma`.
      // It is required at line 18.
      const membership = await prisma.userMembership.findFirst({
        where: {
          userId: user.id,
          companyId: parseInt(headerCompanyId),
          isActive: true,
        },
        include: { role: { include: { permissions: true } } },
      });

      if (!membership) {
        return res
          .status(403)
          .json({ message: "You are not a member of this company" });
      }

      contextCompanyId = parseInt(headerCompanyId);

      // Update user role/permissions based on specific membership if available
      // Note: Currently user.role comes from GLOBAL user.role (legacy).
      //Ideally we overwrite it with membership.role
      if (membership.role) {
        req.user.role = membership.role;
        req.user.permissions = membership.role.permissions.map((p) => p.slug);
      }
    } else {
      // Legacy Fallback
      contextCompanyId = user.companyId;
    }

    const fullPath = (req.baseUrl || "") + req.path;
    const isIdentityReq = fullPath === "/auth/me" || fullPath === "/auth/me/";

    if (!contextCompanyId) {
      // Identity discovery (/auth/me) and initial company creation (onboarding)
      // are allowed without company context.
      if (isIdentityReq) {
        const { runWithContext } = require("../utils/context");
        return runWithContext({ userId: user.id, companyId: null }, () => {
          next();
        });
      }

      if (
        req.method === "POST" &&
        (fullPath === "/companies" || fullPath === "/companies/")
      ) {
        const membershipsCount = await prisma.userMembership.count({
          where: { userId: user.id },
        });

        if (membershipsCount === 0) {
          const { runWithContext } = require("../utils/context");
          return runWithContext({ userId: user.id, companyId: null }, () => {
            next();
          });
        }
      }

      return res.status(400).json({
        message:
          "Company Context Required. Please provide x-company-id header.",
      });
    }

    const store = {
      userId: user.id,
      companyId: contextCompanyId,
    };

    const { runWithContext } = require("../utils/context");
    runWithContext(store, () => {
      next();
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authGuard;
