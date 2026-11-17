const v = require('../../../src/utils/validation');

describe('helpers de validação', () => {
  describe('isNonEmptyString', () => {
    it('aceita texto preenchido', () => expect(v.isNonEmptyString('abc')).toBe(true));

    it.each([[''], ['   '], [null], [undefined], [123], [{}]])('rejeita %p', (value) => {
      expect(v.isNonEmptyString(value)).toBe(false);
    });

    it('respeita o tamanho máximo de 255 caracteres', () => {
      expect(v.isNonEmptyString('a'.repeat(255))).toBe(true);
      expect(v.isNonEmptyString('a'.repeat(256))).toBe(false);
    });
  });

  describe('isEmail', () => {
    it.each([['user@mail.com'], ['a.b+c@dominio.com.br']])('aceita %s', (email) => {
      expect(v.isEmail(email)).toBe(true);
    });

    it.each([['user'], ['user@'], ['@mail.com'], ['user @mail.com'], [42]])('rejeita %p', (email) => {
      expect(v.isEmail(email)).toBe(false);
    });
  });

  describe('isSlug', () => {
    it.each([['shoes'], ['black-friday'], ['produto-01']])('aceita %s', (slug) => {
      expect(v.isSlug(slug)).toBe(true);
    });

    it.each([['Shoes'], ['black friday'], ['-shoes'], ['shoes-'], ['a--b'], ['ação']])('rejeita %s', (slug) => {
      expect(v.isSlug(slug)).toBe(false);
    });
  });

  it('isPlainObject diferencia objetos de arrays e null', () => {
    expect(v.isPlainObject({})).toBe(true);
    expect(v.isPlainObject([])).toBe(false);
    expect(v.isPlainObject(null)).toBe(false);
  });

  describe('parseId', () => {
    it('converte string numérica em inteiro', () => expect(v.parseId('15')).toBe(15));

    it.each([['abc'], ['0'], ['-1'], ['1.5']])('lança 400 para %s', (value) => {
      expect(() => v.parseId(value)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  it('assertValid lança 400 com os detalhes quando há erros', () => {
    const errors = [{ field: 'x', message: 'inválido' }];
    expect(() => v.assertValid([])).not.toThrow();
    expect(() => v.assertValid(errors)).toThrow(expect.objectContaining({ statusCode: 400, details: errors }));
  });

  it('assertBody exige um objeto JSON', () => {
    expect(() => v.assertBody({})).not.toThrow();
    expect(() => v.assertBody([])).toThrow(expect.objectContaining({ statusCode: 400 }));
    expect(() => v.assertBody(undefined)).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});
