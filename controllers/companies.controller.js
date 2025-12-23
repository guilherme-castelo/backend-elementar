const companyService = require('../services/companies.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await companyService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await companyService.getById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Company not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await companyService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await companyService.update(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await companyService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getRoles = async (req, res, next) => {
    res.json([
        { id: 'admin', name: 'Admin' },
        { id: 'user', name: 'User' }
    ]);
};

exports.getPermissions = async (req, res, next) => {
     res.json([
      "users:read", "users:create", "users:update", "users:delete",
      "companies:manage",
      "employees:read", "employees:create", "employees:update", "employees:delete",
      "meals:read", "meals:register", "meals:reports", "meals:delete"
    ]);
};
