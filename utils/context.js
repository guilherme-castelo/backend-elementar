const { AsyncLocalStorage } = require("async_hooks");

const context = new AsyncLocalStorage();

const runWithContext = (store, callback) => {
  return context.run(store, callback);
};

const getStore = () => {
  return context.getStore();
};

const getTenantId = () => {
  const store = getStore();
  return store ? store.companyId : null;
};

module.exports = {
  runWithContext,
  getStore,
  getTenantId,
};
