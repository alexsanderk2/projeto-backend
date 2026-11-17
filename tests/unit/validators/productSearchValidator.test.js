const { parseSearchQuery } = require('../../../src/validators/productSearchValidator');

const expect400 = (fn) => expect(fn).toThrow(expect.objectContaining({ statusCode: 400 }));

describe('parseSearchQuery', () => {
  it('retorna os valores padrão sem filtros', () => {
    expect(parseSearchQuery({})).toEqual({
      pagination: { limit: 12, page: 1, sqlLimit: 12, offset: 0 },
      fields: null,
      match: undefined,
      categoryIds: undefined,
      priceRange: undefined,
      options: [],
    });
  });

  it('interpreta todos os filtros do enunciado', () => {
    const result = parseSearchQuery({
      limit: '30',
      page: '2',
      fields: 'name,images,price',
      match: ' Tênis ',
      category_ids: '15,24,15',
      'price-range': '100-200',
      'option[45]': 'GG,PP',
    });

    expect(result).toEqual({
      pagination: { limit: 30, page: 2, sqlLimit: 30, offset: 30 },
      fields: ['name', 'images', 'price'],
      match: 'Tênis',
      categoryIds: [15, 24],
      priceRange: { min: 100, max: 200 },
      options: [{ key: 45, values: ['GG', 'PP'] }],
    });
  });

  it('aceita o título da opção como chave e preços decimais', () => {
    const result = parseSearchQuery({ 'option[Tamanho]': 'P', 'price-range': '9.90-59.90' });

    expect(result.options).toEqual([{ key: 'Tamanho', values: ['P'] }]);
    expect(result.priceRange).toEqual({ min: 9.9, max: 59.9 });
  });

  it('junta valores quando a mesma opção é repetida na query', () => {
    expect(parseSearchQuery({ 'option[1]': ['P', 'M,G'] }).options).toEqual([{ key: 1, values: ['P', 'M', 'G'] }]);
  });

  it.each([
    ['category_ids com texto', { category_ids: '1,abc' }],
    ['price-range sem hífen', { 'price-range': '100' }],
    ['price-range invertido', { 'price-range': '200-100' }],
    ['opção sem valores', { 'option[1]': ',' }],
    ['campo inexistente', { fields: 'name,password' }],
  ])('rejeita %s', (_, query) => {
    expect400(() => parseSearchQuery(query));
  });
});
