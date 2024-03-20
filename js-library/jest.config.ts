import 'jest'

export default {
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/test/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFiles: ['dotenv/config'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  rootDir: 'test',
  testTimeout: 120000,
  testPathIgnorePatterns: ['/node_modules/'],
  moduleDirectories: ['node_modules'],
}
