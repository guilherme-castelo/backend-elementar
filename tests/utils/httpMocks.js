const mockRequest = (body = {}, params = {}, query = {}, user = {}) => ({
  body,
  params,
  query,
  user,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
};
