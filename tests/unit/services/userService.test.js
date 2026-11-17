const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn(), count: jest.fn(), create: jest.fn(), scope: jest.fn(),
  },
}));

const { User } = require('../../../src/models');
const userService = require('../../../src/services/userService');
const env = require('../../../src/config/env');

/** Simula uma instância de model com update/destroy. */
const fakeUser = (data = {}) => ({
  id: 1, firstname: 'Ana', surname: 'Silva', email: 'ana@mail.com',
  update: jest.fn(), destroy: jest.fn(), ...data,
});

describe('userService', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('findById', () => {
    it('retorna o usuário sem a senha', async () => {
      User.findByPk.mockResolvedValue(fakeUser());
      await userService.findById(1);
      expect(User.findByPk).toHaveBeenCalledWith(1, { attributes: ['id', 'firstname', 'surname', 'email'] });
    });

    it('lança 404 se não existir', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(userService.findById(9)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create', () => {
    const data = { firstname: 'Ana', surname: 'Silva', email: 'ana@mail.com', password: '123@123' };

    it('salva o hash da senha e não a devolve', async () => {
      User.count.mockResolvedValue(0);
      User.create.mockImplementation(async (values) => ({ id: 1, ...values }));

      const result = await userService.create(data);
      const saved = User.create.mock.calls[0][0];

      expect(saved.password).not.toBe('123@123');
      expect(await bcrypt.compare('123@123', saved.password)).toBe(true);
      expect(result).toEqual({ id: 1, firstname: 'Ana', surname: 'Silva', email: 'ana@mail.com' });
    });

    it('lança 400 se o e-mail já estiver cadastrado', async () => {
      User.count.mockResolvedValue(1);
      await expect(userService.create(data)).rejects.toMatchObject({ statusCode: 400 });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza a própria conta', async () => {
      const user = fakeUser();
      User.findByPk.mockResolvedValue(user);

      await userService.update(1, { firstname: 'Bia' }, 1);
      expect(user.update).toHaveBeenCalledWith({ firstname: 'Bia' });
    });

    it('lança 403 ao tentar alterar outra conta', async () => {
      const user = fakeUser({ id: 2 });
      User.findByPk.mockResolvedValue(user);

      await expect(userService.update(2, { firstname: 'X' }, 1)).rejects.toMatchObject({ statusCode: 403 });
      expect(user.update).not.toHaveBeenCalled();
    });

    it('lança 400 se o novo e-mail pertencer a outro usuário', async () => {
      User.findByPk.mockResolvedValue(fakeUser());
      User.count.mockResolvedValue(1);

      await expect(userService.update(1, { email: 'outro@mail.com' }, 1)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lança 404 se o usuário não existir', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(userService.update(9, { firstname: 'X' }, 9)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('remove', () => {
    it('exclui a própria conta', async () => {
      const user = fakeUser();
      User.findByPk.mockResolvedValue(user);

      await userService.remove(1, 1);
      expect(user.destroy).toHaveBeenCalled();
    });

    it('lança 403 ao tentar excluir outra conta', async () => {
      User.findByPk.mockResolvedValue(fakeUser({ id: 2 }));
      await expect(userService.remove(2, 1)).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('generateToken', () => {
    const mockFindOne = (user) => User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(user) });

    it('gera um JWT com o id do usuário quando as credenciais estão corretas', async () => {
      mockFindOne({ id: 7, email: 'ana@mail.com', password: await bcrypt.hash('123@123', 4) });

      const { token } = await userService.generateToken({ email: 'ana@mail.com', password: '123@123' });
      const payload = jwt.verify(token, env.jwt.secret);

      expect(User.scope).toHaveBeenCalledWith('withPassword');
      expect(payload).toMatchObject({ sub: 7, email: 'ana@mail.com' });
    });

    it('lança 400 com senha incorreta', async () => {
      mockFindOne({ id: 7, email: 'ana@mail.com', password: await bcrypt.hash('123@123', 4) });
      await expect(userService.generateToken({ email: 'ana@mail.com', password: 'errada' }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Email ou senha inválidos' });
    });

    it('lança 400 com a mesma mensagem quando o e-mail não existe', async () => {
      mockFindOne(null);
      await expect(userService.generateToken({ email: 'nao@existe.com', password: '123@123' }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Email ou senha inválidos' });
    });
  });
});
