const userValidator = require('../../../src/validators/userValidator');
const { validUser } = require('../../helpers/fixtures');

/** Executa a função e devolve os campos com erro (ou [] se for válido). */
const fieldsWithError = (fn) => {
  try {
    fn();
    return [];
  } catch (error) {
    return (error.details || []).map((d) => d.field);
  }
};

describe('userValidator', () => {
  describe('validateCreate', () => {
    it('normaliza os dados e remove confirmPassword', () => {
      const data = userValidator.validateCreate(validUser({ firstname: '  Ana ', email: 'ANA@Mail.com' }));
      expect(data).toEqual({ firstname: 'Ana', surname: 'Silva', email: 'ana@mail.com', password: '123@123' });
    });

    it('acusa todos os campos obrigatórios ausentes', () => {
      expect(fieldsWithError(() => userValidator.validateCreate({})))
        .toEqual(['firstname', 'surname', 'email', 'password']);
    });

    it('exige senha com no mínimo 6 caracteres', () => {
      const body = validUser({ password: '12345', confirmPassword: '12345' });
      expect(fieldsWithError(() => userValidator.validateCreate(body))).toEqual(['password']);
    });

    it('rejeita senha acima de 72 bytes (limite do bcrypt)', () => {
      const password = 'ç'.repeat(40); // 40 caracteres, 80 bytes
      expect(fieldsWithError(() => userValidator.validateCreate(validUser({ password, confirmPassword: password }))))
        .toEqual(['password']);
    });

    it('exige confirmPassword igual a password', () => {
      expect(fieldsWithError(() => userValidator.validateCreate(validUser({ confirmPassword: 'outra' }))))
        .toEqual(['confirmPassword']);
    });

    it('rejeita corpo que não é objeto', () => {
      expect(() => userValidator.validateCreate(null)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('validateUpdate', () => {
    it('aceita atualização parcial', () => {
      expect(userValidator.validateUpdate({ surname: 'Souza' })).toEqual({ surname: 'Souza' });
    });

    it('ignora campos não permitidos, como password', () => {
      expect(userValidator.validateUpdate({ firstname: 'Bia', password: 'nova' })).toEqual({ firstname: 'Bia' });
    });

    it('exige ao menos um campo', () => {
      expect(fieldsWithError(() => userValidator.validateUpdate({}))).toEqual(['body']);
    });

    it('valida os campos informados', () => {
      expect(fieldsWithError(() => userValidator.validateUpdate({ firstname: '', email: 'x' })))
        .toEqual(['firstname', 'email']);
    });
  });

  describe('validateToken', () => {
    it('normaliza o e-mail', () => {
      expect(userValidator.validateToken({ email: 'ANA@mail.com', password: '123' }))
        .toEqual({ email: 'ana@mail.com', password: '123' });
    });

    it('exige e-mail e senha', () => {
      expect(fieldsWithError(() => userValidator.validateToken({}))).toEqual(['email', 'password']);
    });
  });
});
