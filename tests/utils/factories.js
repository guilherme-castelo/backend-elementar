const createCompany = (overrides = {}) => ({
  id: overrides.id || Math.floor(Math.random() * 1000) + 1,
  name: overrides.name || `Company ${Math.floor(Math.random() * 1000)}`,
  type: "MATRIZ",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createGroup = (overrides = {}) => ({
  id: overrides.id || `group-${Math.floor(Math.random() * 1000)}`,
  name: overrides.name || `Group ${Math.floor(Math.random() * 1000)}`,
  ...overrides,
});

const createRole = (overrides = {}) => ({
  id: overrides.id || Math.floor(Math.random() * 100) + 1,
  name: "Admin",
  description: "Administrator",
  permissions: [],
  ...overrides,
});

const createUser = (overrides = {}) => ({
  id: overrides.id || Math.floor(Math.random() * 10000) + 1,
  name: overrides.name || `User ${Math.floor(Math.random() * 1000)}`,
  email:
    overrides.email || `user${Math.floor(Math.random() * 10000)}@example.com`,
  isActive: true,
  // Deprecated fields (kept for compatibility during migration)
  companyId: null,
  roleId: null,
  role: null,
  ...overrides,
});

const createMembership = (user, company, role, overrides = {}) => ({
  id: overrides.id || `mem-${Math.floor(Math.random() * 10000)}`,
  userId: user.id,
  companyId: company.id,
  roleId: role.id,
  user: user,
  company: company,
  role: role,
  isActive: true,
  ...overrides,
});

module.exports = {
  createCompany,
  createGroup,
  createRole,
  createUser,
  createMembership,
};
