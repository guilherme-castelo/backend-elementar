const usersService = require("../services/users.service");

exports.getAll = async (req, res, next) => {
  try {
    const data = await usersService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await usersService.getById(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await usersService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await usersService.update(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await usersService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.inactivate = async (req, res, next) => {
  try {
    // Inactivate logic via update
    await usersService.update(req.params.id, { isActive: false });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

