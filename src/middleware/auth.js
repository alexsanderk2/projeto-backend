const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');

// Esquema "Bearer" sem diferenciar maiúsculas (RFC 7235)
const BEARER_REGEX = /^Bearer\s+(\S+)$/i;

/**
 * Exige o cabeçalho "Authorization: Bearer <jwt>".
 * Se o token for válido e o usuário ainda existir, disponibiliza
 * o usuário autenticado em req.user.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    throw AppError.unauthorized('Token de autorização não informado');
  }

  const match = header.trim().match(BEARER_REGEX);
  if (!match) {
    throw AppError.unauthorized('Formato do token inválido. Use: Bearer <token>');
  }

  let payload;
  try {
    payload = jwt.verify(match[1], env.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    throw AppError.unauthorized('Token inválido ou expirado');
  }

  // Impede o uso de tokens de usuários que já foram excluídos
  const user = await User.findByPk(payload.sub, { attributes: ['id', 'email'] });
  if (!user) {
    throw AppError.unauthorized('Usuário do token não existe mais');
  }

  req.user = { id: user.id, email: user.email };
  return next();
}

module.exports = authenticate;
