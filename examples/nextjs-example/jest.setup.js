// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock console methods to avoid noise in tests
const originalConsole = global.console;

global.console = {
  ...originalConsole,
  // Mock debug to avoid noise in tests
  debug: jest.fn(),
};
