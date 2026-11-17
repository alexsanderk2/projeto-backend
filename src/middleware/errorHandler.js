const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');

/**
 * Middleware para rotas inexistentes (404).
 */
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Rota ${req.method} ${req.originalUrl} não encontrada`));
}

/**
 * Middleware central de tratamento de erros.
 * Converte erros conhecidos (AppError, Sequelize, JSON inválido) em
 * respostas HTTP padronizadas: { message, details? }.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // Corpo da requisição com JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Corpo da requisição muito grande' });
  }

  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    return res.status(400).json({
      message: `Já existe um registro com este valor (${fields.join(', ')})`,
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      message: 'Dados inválidos',
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: 'Referência a um registro inexistente' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
