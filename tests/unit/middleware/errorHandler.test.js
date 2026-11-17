const {
  ValidationError, ValidationErrorItem, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError,
} = require('sequelize');

const { errorHandler, notFoundHandler } = require('../../../src/middleware/errorHandler');
const AppError = require('../../../src/utils/AppError');

/** Cria um objeto res falso que registra status e corpo. */
function mockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

const run = (error) => {
  const res = mockResponse();
  errorHandler(error, {}, res, jest.fn());
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

describe('errorHandler', () => {
  it('usa o status e a mensagem de AppError', () => {
    expect(run(AppError.notFound('Produto não encontrado'))).toEqual({
      status: 404, body: { message: 'Produto não encontrado', details: undefined },
    });
  });

  it('JSON malformado vira 400', () => {
    expect(run(Object.assign(new SyntaxError('x'), { type: 'entity.parse.failed' })).status).toBe(400);
  });

  it('corpo muito grande vira 413', () => {
    expect(run({ type: 'entity.too.large' }).status).toBe(413);
  });

  it('violação de unicidade vira 400 com o campo', () => {
    const error = new UniqueConstraintError({
      errors: [new ValidationErrorItem('slug must be unique', 'unique violation', 'slug', 'shoes')],
      fields: { slug: 'shoes' },
    });
    const { status, body } = run(error);

    expect(status).toBe(400);
    expect(body.message).toContain('slug');
    expect(body.details).toEqual([{ field: 'slug', message: 'slug must be unique' }]);
  });

  it('erro de validação do Sequelize vira 400', () => {
    const error = new ValidationError('inválido', [new ValidationErrorItem('name cannot be null', 'notNull', 'name')]);
    expect(run(error)).toEqual({
      status: 400, body: { message: 'Dados inválidos', details: [{ field: 'name', message: 'name cannot be null' }] },
    });
  });

  it('chave estrangeira inexistente vira 400', () => {
    expect(run(new ForeignKeyConstraintError({ parent: new Error('fk') })).status).toBe(400);
  });

  it.each([['ER_DATA_TOO_LONG'], ['ER_WARN_DATA_OUT_OF_RANGE']])('erro de dados do banco (%s) vira 400', (code) => {
    const error = new DatabaseError(Object.assign(new Error('db'), { code, sql: '' }));
    expect(run(error).status).toBe(400);
  });

  it('erro desconhecido vira 500 sem expor detalhes', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(run(new Error('senha do banco: 123'))).toEqual({ status: 500, body: { message: 'Erro interno do servidor' } });
    console.error.mockRestore();
  });
});

describe('notFoundHandler', () => {
  it('encaminha um 404 com o método e a rota', () => {
    const next = jest.fn();
    notFoundHandler({ method: 'GET', originalUrl: '/nada' }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Rota GET /nada não encontrada' }));
  });
});
