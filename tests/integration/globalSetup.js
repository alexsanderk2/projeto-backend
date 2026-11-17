/**
 * Executado uma vez antes dos testes de integração:
 * cria o banco de teste (se não existir) e recria todas as tabelas
 * com as migrations, garantindo um estado limpo a cada execução.
 */
const { execSync } = require('child_process');

module.exports = async () => {
  const options = { stdio: 'ignore', env: { ...process.env, NODE_ENV: 'test' } };
  const cli = 'npx sequelize-cli';

  try {
    execSync(`${cli} db:create`, options);
  } catch {
    // O banco já existe
  }

  execSync(`${cli} db:migrate:undo:all`, options);
  execSync(`${cli} db:migrate`, options);
};
