const employeesService = require("../services/employees.service");

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
    const { mealsAction } = req.query;
    await employeesService.delete(req.params.id, mealsAction);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
