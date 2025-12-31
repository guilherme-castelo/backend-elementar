const companyRepository = require("../repositories/companies.repository");
const { NotFoundError } = require("../errors/AppError");

class CompanyService {
  async getAll() {
    return companyRepository.getAll();
  }

  async getById(id) {
    const company = await companyRepository.getById(id);
    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  async create(data) {
    // Basic validation could go here
    return companyRepository.create(data);
  }

  async update(id, data) {
    await this.getById(id); // check existence
    return companyRepository.update(id, data);
  }

  async delete(id) {
    await this.getById(id); // check existence
    return companyRepository.delete(id);
  }
}

module.exports = new CompanyService();

