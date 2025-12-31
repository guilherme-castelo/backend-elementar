const tasksService = require('../services/tasks.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await tasksService.getAll(req.query, req.user); // req.user from Auth middleware
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await tasksService.getById(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};


exports.create = async (req, res, next) => {
  try {
    // Force ownerUserId from token if not provided or security enforcement
    // But typically payload sends it. Let's trust payload or override?
    // Trust payload for MVP but ensure user is current user? 
    // tasksService logic handles data.
    if (!req.body.ownerUserId) req.body.ownerUserId = req.user.id;

    const data = await tasksService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await tasksService.update(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await tasksService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const data = await tasksService.getComments(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const data = await tasksService.addComment(req.params.id, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
