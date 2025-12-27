const service = require("../services/invitations.service");

exports.invite = async (req, res, next) => {
  try {
    const { email, roleId } = req.body;
    const result = await service.create(req.user.companyId, { email, roleId });
    res.status(201).json({ message: "Invitation sent", token: result.token }); // Returning token for dev convenience
  } catch (error) {
    next(error);
  }
};

exports.validate = async (req, res, next) => {
  try {
    const { token } = req.params;
    const info = await service.validateToken(token);
    res.json({ email: info.email, isValid: true });
  } catch (error) {
    res.status(400).json({ message: error.message, isValid: false });
  }
};

exports.accept = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;
    await service.accept(token, { name, password });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    next(error);
  }
};
