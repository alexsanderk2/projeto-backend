/**
 * Erro de aplicação com status HTTP associado.
 * Lançado pelos services/validators e tratado pelo middleware de erros.
 */
class AppError extends Error {
  constructor(message, statusCode = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message = 'Requisição inválida', details) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Não autorizado') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Acesso negado') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new AppError(message, 404);
  }
}

module.exports = AppError;
