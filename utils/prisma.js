const { PrismaClient } = require("@prisma/client");
const { getTenantId } = require("./context");

const TENANT_MODELS = ["User", "Employee", "Meal", "Invitation"];

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        const companyId = getTenantId();
        if (companyId && TENANT_MODELS.includes(model)) {
          // Inject companyId into where clause
          args.where = { ...args.where, companyId };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        const companyId = getTenantId();
        if (companyId && TENANT_MODELS.includes(model)) {
          args.where = { ...args.where, companyId };
        }
        return query(args);
      },
      async findUnique({ args, query }) {
        // findUnique usually uses ID only, but for security in SaaS,
        // we should usually ensure the entity belongs to the tenant.
        // However, Prisma findUnique throws if where has non-unique fields.
        // Strategy: If findUnique is used, we must convert it to findFirst if we want to add non-unique filters
        // OR simply rely on the fact that IDs *should* be unique.
        // For stricter isolation, developers should prefer findFirst({ where: { id, companyId }})
        return query(args);
      },
      async count({ model, args, query }) {
        const companyId = getTenantId();
        if (companyId && TENANT_MODELS.includes(model)) {
          args.where = { ...args.where, companyId };
        }
        return query(args);
      },
      async create({ model, args, query }) {
        const companyId = getTenantId();
        if (companyId && TENANT_MODELS.includes(model)) {
          // Auto-assign companyId on create
          args.data = { ...args.data, companyId };
        }
        return query(args);
      },
      // Note: update/delete also utilize 'where', so similar logic applies if needed.
    },
  },
});

module.exports = prisma;
