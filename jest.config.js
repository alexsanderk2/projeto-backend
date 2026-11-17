/**
 * Configuração do Jest com dois projetos:
 *  - unit: testes isolados, sem banco de dados (models são mockados)
 *  - integration: testes das rotas com supertest em um banco MySQL de teste
 */
module.exports = {
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/database/**'],
  coverageDirectory: 'coverage',
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      globalSetup: '<rootDir>/tests/integration/globalSetup.js',
    },
  ],
};
