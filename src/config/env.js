/**
 * Carrega as variáveis de ambiente do arquivo .env e expõe
 * um objeto de configuração único para toda a aplicação.
 */
require('dotenv').config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3333,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3333}`,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};

module.exports = env;
