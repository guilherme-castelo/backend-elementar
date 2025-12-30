const usersRepository = require("../repositories/users.repository");
const bcrypt = require('bcryptjs');

class UsersService {
  async getAll() {
    return usersRepository.getAll();
  }

  async getById(id) {
    return usersRepository.getById(id);
  }

  async create(data) {
    const payload = { ...data };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.companyId) {
      payload.companyId = parseInt(payload.companyId);
    }
    // Preferences/Address might need stringifying if passed as objects
    if (typeof payload.preferences === 'object') payload.preferences = JSON.stringify(payload.preferences);
    if (typeof payload.address === 'object') payload.address = JSON.stringify(payload.address);
    if (Array.isArray(payload.roles)) payload.roles = payload.roles.join(','); // or keep as string

    return usersRepository.create(payload);
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.companyId) payload.companyId = parseInt(payload.companyId);

    if (typeof payload.preferences === 'object') payload.preferences = JSON.stringify(payload.preferences);
    if (typeof payload.address === 'object') payload.address = JSON.stringify(payload.address);
    if (Array.isArray(payload.roles)) payload.roles = payload.roles.join(',');

    const user = await usersRepository.update(id, payload);

    // Remove password from return
    const { password, ...rest } = user;
    return rest;
  }

  async delete(id) {
    return usersRepository.delete(id);
  }
}

module.exports = new UsersService();
