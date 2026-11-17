const jwt = require('jsonwebtoken');

jest.mock('../../../src/models', () => ({ User: { findByPk: jest.fn() } }));

const { User } = require('../../../src/models');
const authenticate = require('../../../src/middleware/auth');
const env = require('../../../src/config/env');

const sign = (payload, options = {}) => jwt.sign(payload, env.jwt.secret, { expiresIn: '1h', ...options });

/** Executa o middleware e devolve { error, req }. */
async function run(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const next = jest.fn();

  try {
    await authenticate(req, {}, next);
    return { error: null, req, next };
  } catch (error) {
    return { error, req, next };
  }
}

describe('middleware authenticate', () => {
  beforeEach(() => {
    User.findByPk.mockReset();
    User.findByPk.mockResolvedValue({ id: 1, email: 'ana@mail.com' });
  });

  it('com token válido, popula req.user e chama next()', async () => {
    const { error, req, next } = await run(`Bearer ${sign({ sub: 1, email: 'ana@mail.com' })}`);

    expect(error).toBeNull();
    expect(req.user).toEqual({ id: 1, email: 'ana@mail.com' });
    expect(next).toHaveBeenCalledWith();
    expect(User.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('aceita o esquema "bearer" em minúsculas', async () => {
    const { error } = await run(`bearer ${sign({ sub: 1 })}`);
    expect(error).toBeNull();
  });

  it.each([
    ['sem cabeçalho', undefined, 'Token de autorização não informado'],
    ['sem o esquema Bearer', 'abc.def.ghi', 'Formato do token inválido. Use: Bearer <token>'],
    ['esquema Basic', 'Basic dXNlcjpwYXNz', 'Formato do token inválido. Use: Bearer <token>'],
    ['token adulterado', 'Bearer abc.def.ghi', 'Token inválido ou expirado'],
  ])('retorna 401 %s', async (_, header, message) => {
    const { error, next } = await run(header);

    expect(error).toMatchObject({ statusCode: 401, message });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 para token expirado', async () => {
    const { error } = await run(`Bearer ${sign({ sub: 1 }, { expiresIn: -10 })}`);
    expect(error).toMatchObject({ statusCode: 401, message: 'Token inválido ou expirado' });
  });

  it('retorna 401 para token assinado com outro segredo', async () => {
    const token = jwt.sign({ sub: 1 }, 'outro-segredo');
    const { error } = await run(`Bearer ${token}`);
    expect(error).toMatchObject({ statusCode: 401 });
  });

  it('retorna 401 quando o usuário do token foi excluído', async () => {
    User.findByPk.mockResolvedValue(null);
    const { error } = await run(`Bearer ${sign({ sub: 99 })}`);
    expect(error).toMatchObject({ statusCode: 401, message: 'Usuário do token não existe mais' });
  });
});
