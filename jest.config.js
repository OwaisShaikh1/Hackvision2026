/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'cjs', 'mjs', 'json'],
  testMatch: ['**/tests/**/*.test.cjs'],
};

export default config;
