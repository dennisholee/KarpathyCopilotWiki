module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@commands/(.*)$': '<rootDir>/src/commands/$1',
    '^@ingest/(.*)$': '<rootDir>/src/ingest/$1',
    '^@search/(.*)$': '<rootDir>/src/search/$1',
    '^@query/(.*)$': '<rootDir>/src/query/$1',
    '^@lint/(.*)$': '<rootDir>/src/lint/$1',
    '^@copilot/(.*)$': '<rootDir>/src/copilot/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
