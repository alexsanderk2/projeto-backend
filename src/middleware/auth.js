const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Exige o cabeçalho "Authorization: Bearer <jwt>".
 * Se o token for válido, disponibiliza o usuário autenticado em req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return next(AppError.unauthorized('Token de autorização não informado'));
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Formato do token inválido. Use: Bearer <token>'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(AppError.unauthorized('Token inválido ou expirado'));
  }
}

module.exports = authenticate;
