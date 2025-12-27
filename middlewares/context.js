const { runWithContext } = require("../utils/context");

const contextMiddleware = (req, res, next) => {
  const store = {
    // Only populate if authenticated
    companyId: req.user ? req.user.companyId : null,
    userId: req.user ? req.user.id : null,
  };

  runWithContext(store, () => {
    next();
  });
};

module.exports = contextMiddleware;
