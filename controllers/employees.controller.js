const employeesService = require('../services/employees.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await employeesService.getAll(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await employeesService.getById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Employee not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await employeesService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await employeesService.update(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await employeesService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
