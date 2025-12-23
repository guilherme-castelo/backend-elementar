const mealsService = require('../services/meals.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await mealsService.getAll(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const data = await mealsService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res, next) => {
  try {
    await mealsService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
