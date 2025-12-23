const notificationService = require('../services/notifications.service');

exports.getAll = async (req, res, next) => {
  try {
    // Should filter by current user
    const data = await notificationService.getAll(req.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await notificationService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAsRead(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const data = await notificationService.archive(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
