const AppError = require('../../../src/utils/AppError');

describe('AppError', () => {
  it('usa 400 como status padrão', () => {
    const error = new AppError('falhou');
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('falhou');
  });

  it.each([
    ['badRequest', 400],
    ['unauthorized', 401],
    ['forbidden', 403],
    ['notFound', 404],
  ])('%s() cria erro com status %i', (factory, status) => {
    const error = AppError[factory]('mensagem');
    expect(error.statusCode).toBe(status);
    expect(error.message).toBe('mensagem');
  });

  it('badRequest() guarda os detalhes da validação', () => {
    const details = [{ field: 'name', message: 'obrigatório' }];
    expect(AppError.badRequest('Dados inválidos', details).details).toEqual(details);
  });
});
