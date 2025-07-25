module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: [
        '.*integration/browser-integration\\.test\\.ts$',
        '.*integration/end-to-end\\.test\\.ts$'
      ]
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: [
        '**/__tests__/integration/browser-integration.test.ts',
        '**/__tests__/integration/end-to-end.test.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/browser-setup.ts']
    },
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/integration/server-integration.test.ts']
    }
  ]
};