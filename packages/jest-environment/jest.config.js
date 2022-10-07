/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: './dist',
  setupFilesAfterEnv: ['./jest.setup'],
  transform: {
    '\\.(js|jsx|ts|tsx)$': [
      '@swc/jest',
      /** @type {import("@swc/core").Config} */
      { jsc: { parser: { syntax: 'typescript' } } },
    ],
  },
}
