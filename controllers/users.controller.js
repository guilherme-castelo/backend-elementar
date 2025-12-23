const usersService = require('../services/users.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await usersService.getAll();
    const safeData = data.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(safeData);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await usersService.getById(req.params.id);
    if (!data) return res.status(404).json({ message: 'User not found' });
    const { password, ...rest } = data;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await usersService.create(req.body);
    const { password, ...rest } = data;
    res.status(201).json(rest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await usersService.update(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res, next) => {
  try {
    await usersService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
