/**
 * Carrega as variáveis de ambiente do arquivo .env e expõe
 * um objeto de configuração único para toda a aplicação.
 */
const os = require('os');
const path = require('path');

require('dotenv').config({ quiet: true });

const DEFAULT_SECRETS = ['dev-secret', 'troque-esta-chave-por-uma-bem-segura'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3333,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3333}`,
  // Pasta onde as imagens enviadas são gravadas (servida na rota /media).
  // Nos testes usa uma pasta temporária para não tocar nas imagens reais.
  mediaDir: process.env.MEDIA_DIR || (process.env.NODE_ENV === 'test'
    ? path.join(os.tmpdir(), 'digital-store-test-media')
    : path.resolve(__dirname, '..', '..', 'public', 'media')),
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
