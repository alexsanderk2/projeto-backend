/**
 * Carrega as variáveis de ambiente do arquivo .env e expõe
 * um objeto de configuração único para toda a aplicação.
 */
require('dotenv').config({ quiet: true });

const DEFAULT_SECRETS = ['dev-secret', 'troque-esta-chave-por-uma-bem-segura'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3333,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3333}`,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};

// Em produção, não permite subir a API com um segredo JWT fraco ou de exemplo
if (env.nodeEnv === 'production' && (DEFAULT_SECRETS.includes(env.jwt.secret) || env.jwt.secret.length < 32)) {
  throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres antes de iniciar em produção');
}

module.exports = env;
