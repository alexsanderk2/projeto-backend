const { parsePagination, parseFields, parseBoolean } = require('../../../src/utils/queryParams');

const expect400 = (fn) => expect(fn).toThrow(expect.objectContaining({ statusCode: 400 }));

describe('parsePagination', () => {
  it('usa limit=12 e page=1 por padrão', () => {
    expect(parsePagination({})).toEqual({ limit: 12, page: 1, sqlLimit: 12, offset: 0 });
  });

  it('calcula o offset a partir da página', () => {
    expect(parsePagination({ limit: '30', page: '3' })).toEqual({ limit: 30, page: 3, sqlLimit: 30, offset: 60 });
  });

  it('limit=-1 busca todos e ignora a página', () => {
    expect(parsePagination({ limit: '-1', page: '5' })).toEqual({
      limit: -1, page: 1, sqlLimit: undefined, offset: undefined,
    });
  });

  it.each([['0'], ['-2'], ['abc'], ['1.5'], ['101'], ['100000000000000000000']])('rejeita limit=%s', (limit) => {
    expect400(() => parsePagination({ limit }));
  });

  it.each([['0'], ['-1'], ['abc'], ['1e300'], ['100000000000000000000']])('rejeita page=%s', (page) => {
    expect400(() => parsePagination({ page }));
  });
});

describe('parseFields', () => {
  const allowed = ['id', 'name', 'slug'];

  it('retorna null quando não informado', () => {
    expect(parseFields(undefined, allowed)).toBeNull();
    expect(parseFields('', allowed)).toBeNull();
  });

  it('separa os campos por vírgula e ignora espaços', () => {
    expect(parseFields('name, slug', allowed)).toEqual(['name', 'slug']);
  });

  it('rejeita campos que não existem', () => {
    expect400(() => parseFields('name,senha', allowed));
  });
});

describe('parseBoolean', () => {
  it.each([['true', true], ['1', true], ['false', false], ['0', false]])('converte %s em %p', (value, expected) => {
    expect(parseBoolean(value, 'use_in_menu')).toBe(expected);
  });

  it('retorna undefined quando não informado', () => {
    expect(parseBoolean(undefined, 'use_in_menu')).toBeUndefined();
  });

  it('rejeita valores inválidos', () => {
    expect400(() => parseBoolean('talvez', 'use_in_menu'));
  });
});
