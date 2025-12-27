const prisma = require("../utils/prisma");

/**
 * Checks if the company has reached the limit for a specific resource.
 * @param {string} resource - 'users', 'jobs', etc.
 */
const checkUsage = (resource) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.companyId) {
        return res.status(401).json({ message: "Company context missing" });
      }

      const companyId = req.user.companyId;

      // 1. Fetch Company with Plan
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { plan: true },
      });

      if (!company)
        return res.status(404).json({ message: "Company not found" });

      // If no plan, assume basics or block? Let's assume Free/No limit for MVP or block.
      // Better: if no plan, maybe it's legacy, allow access or default to restrictive?
      // For this SaaS evolution, we enforce Plan.
      if (!company.plan) {
        // Allow for backward compat or explicit 'No Plan' handling
        // console.warn('Company without plan:', companyId);
        return next();
      }

      const plan = company.plan;

      // 2. Check Resource Limit
      if (resource === "users") {
        const currentCount = await prisma.user.count({ where: { companyId } });
        if (currentCount >= plan.maxUsers) {
          return res.status(403).json({
            message: `Plan limit reached. Max users: ${plan.maxUsers}. Upgrade required.`,
          });
        }
      }

      // Add other resource checks here (e.g. 'storage', 'features') as needed

      next();
    } catch (error) {
      console.error("Usage Check Error:", error);
      res.status(500).json({ message: "Error checking plan limits" });
    }
  };
};

module.exports = checkUsage;
