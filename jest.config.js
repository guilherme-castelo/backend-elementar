module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup.js"],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "middlewares/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
};
