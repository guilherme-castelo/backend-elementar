const { mockDeep } = require('jest-mock-extended');

const prismaMock = mockDeep();

// Mock the $extends method to return the mock itself, enabling chaining
prismaMock.$extends.mockReturnValue(prismaMock);

module.exports = prismaMock;
