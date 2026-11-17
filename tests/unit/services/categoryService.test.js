jest.mock('../../../src/models', () => ({
  Category: {
    findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(),
  },
}));

const { Category } = require('../../../src/models');
const categoryService = require('../../../src/services/categoryService');

const pagination = { limit: 12, page: 1, sqlLimit: 12, offset: 0 };

describe('categoryService', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('search', () => {
    it('monta a consulta com paginação e devolve o formato do enunciado', async () => {
      Category.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 10 });

      const result = await categoryService.search({ pagination, fields: null, useInMenu: undefined });

      expect(Category.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        attributes: ['id', 'name', 'slug', 'use_in_menu'],
        order: [['id', 'ASC']],
        limit: 12,
        offset: 0,
      });
      expect(result).toEqual({ data: [{ id: 1 }], total: 10, limit: 12, page: 1 });
    });

    it('aplica filtro use_in_menu, fields e limit=-1', async () => {
      Category.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await categoryService.search({
        pagination: { limit: -1, page: 1, sqlLimit: undefined, offset: undefined },
        fields: ['name'],
        useInMenu: true,
      });

      expect(Category.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { use_in_menu: true }, attributes: ['name'], limit: undefined, offset: undefined,
      }));
    });
  });

  describe('create', () => {
    it('cria e devolve apenas os campos públicos', async () => {
      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({
        id: 1, name: 'Shoes', slug: 'shoes', use_in_menu: true, createdAt: new Date(),
      });

      expect(await categoryService.create({ name: 'Shoes', slug: 'shoes', use_in_menu: true }))
        .toEqual({ id: 1, name: 'Shoes', slug: 'shoes', use_in_menu: true });
    });

    it('lança 400 se o slug já existir', async () => {
      Category.findOne.mockResolvedValue({ id: 5 });
      await expect(categoryService.create({ name: 'Shoes', slug: 'shoes' })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('update', () => {
    it('permite manter o próprio slug', async () => {
      const category = { id: 1, update: jest.fn() };
      Category.findByPk.mockResolvedValue(category);
      Category.findOne.mockResolvedValue({ id: 1 });

      await categoryService.update(1, { slug: 'shoes' });
      expect(category.update).toHaveBeenCalledWith({ slug: 'shoes' });
    });

    it('lança 404 se a categoria não existir', async () => {
      Category.findByPk.mockResolvedValue(null);
      await expect(categoryService.update(9, { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('remove', () => {
    it('exclui a categoria', async () => {
      const category = { id: 1, destroy: jest.fn() };
      Category.findByPk.mockResolvedValue(category);

      await categoryService.remove(1);
      expect(category.destroy).toHaveBeenCalled();
    });

    it('lança 404 se a categoria não existir', async () => {
      Category.findByPk.mockResolvedValue(null);
      await expect(categoryService.remove(9)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
