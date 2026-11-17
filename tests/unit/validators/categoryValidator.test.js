const categoryValidator = require('../../../src/validators/categoryValidator');

const fieldsWithError = (fn) => {
  try {
    fn();
    return [];
  } catch (error) {
    return (error.details || []).map((d) => d.field);
  }
};

describe('categoryValidator', () => {
  describe('validateCreate', () => {
    it('aceita categoria válida', () => {
      expect(categoryValidator.validateCreate({ name: ' Shoes ', slug: 'shoes', use_in_menu: true }))
        .toEqual({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    });

    it('use_in_menu é opcional', () => {
      expect(categoryValidator.validateCreate({ name: 'Shoes', slug: 'shoes' })).toEqual({ name: 'Shoes', slug: 'shoes' });
    });

    it('exige name e slug', () => {
      expect(fieldsWithError(() => categoryValidator.validateCreate({}))).toEqual(['name', 'slug']);
    });

    it('rejeita slug fora do padrão e use_in_menu não booleano', () => {
      expect(fieldsWithError(() => categoryValidator.validateCreate({ name: 'A', slug: 'Black Friday', use_in_menu: 'sim' })))
        .toEqual(['slug', 'use_in_menu']);
    });
  });

  describe('validateUpdate', () => {
    it('aceita atualização parcial', () => {
      expect(categoryValidator.validateUpdate({ use_in_menu: false })).toEqual({ use_in_menu: false });
    });

    it('exige ao menos um campo', () => {
      expect(fieldsWithError(() => categoryValidator.validateUpdate({}))).toEqual(['body']);
    });
  });
});
