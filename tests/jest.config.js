module.exports = {
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/client/**/*.test.{ts,tsx}'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../client/src/$1',
        '^@components/(.*)$': '<rootDir>/../client/src/components/$1',
        '^@services/(.*)$': '<rootDir>/../client/src/services/$1',
        '^@store/(.*)$': '<rootDir>/../client/src/store/$1',
        '^@utils/(.*)$': '<rootDir>/../client/src/utils/$1',
        '^@api/(.*)$': '<rootDir>/../client/src/api/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/**/*.test.ts'],
      moduleNameMapper: {
        '^@controllers/(.*)$': '<rootDir>/../server/controllers/$1',
        '^@services/(.*)$': '<rootDir>/../server/services/$1',
        '^@middlewares/(.*)$': '<rootDir>/../server/middlewares/$1',
        '^@routes/(.*)$': '<rootDir>/../server/routes/$1',
        '^@models/(.*)$': '<rootDir>/../server/models/$1',
        '^@utils/(.*)$': '<rootDir>/../server/utils/$1',
        '^@config/(.*)$': '<rootDir>/../server/config/$1',
      },
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
    },
  ],
  collectCoverageFrom: [
    '../client/src/**/*.{ts,tsx}',
    '../server/**/*.ts',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}
