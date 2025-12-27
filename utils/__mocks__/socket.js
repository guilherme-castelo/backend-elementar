const getIO = jest.fn().mockReturnValue({
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
});

const init = jest.fn();

module.exports = {
  getIO,
  init,
};
