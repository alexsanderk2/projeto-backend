/**
 * Ponto de entrada: testa a conexão com o banco e sobe o servidor HTTP.
 */
const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida.');

    app.listen(env.port, () => {
      console.log(`Servidor rodando em ${env.appUrl}`);
      console.log(`Documentação disponível em ${env.appUrl}/docs`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error.message);
    process.exit(1);
  }
}

start();
