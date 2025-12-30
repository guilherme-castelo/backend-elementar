const mealsService = require("../services/meals.service");

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

exports.getPendingCount = async (req, res, next) => {
  try {
    const { companyId } = req.user || { companyId: 1 };
    const count = await mealsService.countPending(companyId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

exports.countByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const count = await mealsService.countByEmployee(employeeId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

exports.getPending = async (req, res, next) => {
  try {
    const { companyId } = req.user || { companyId: 1 };
    const data = await mealsService.getPendingMeals(companyId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.deletePendingByMatricula = async (req, res, next) => {
  try {
    const { companyId } = req.user || { companyId: 1 };
    const { matricula } = req.params;
    await mealsService.deletePendingByMatricula(matricula, companyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.toggleIgnorePending = async (req, res, next) => {
  try {
    const { companyId } = req.user || { companyId: 1 };
    const { matricula } = req.params;
    const { ignore } = req.body; // Expecting boolean
    await mealsService.toggleIgnorePendingByMatricula(
      matricula,
      companyId,
      ignore
    );
    res.status(200).send();
  } catch (error) {
    next(error);
  }
};

exports.analyzeImport = async (req, res, next) => {
  try {
    const { companyId } = req.user || { companyId: 1 }; // Fallback for mockup if needed
    const result = await mealsService.analyzeBatch(req.body, companyId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.importBulk = async (req, res, next) => {
  try {
    const { companyId } = req.user || { companyId: 1 };
    const { records } = req.body;
    const result = await mealsService.importBulk(records, companyId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
