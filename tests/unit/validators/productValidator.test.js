const productValidator = require('../../../src/validators/productValidator');
const {
  PNG_BASE64, JPG_BASE64, GIF_BASE64, WEBP_BASE64, TEXT_BASE64, validProduct,
} = require('../../helpers/fixtures');

const fieldsWithError = (fn) => {
  try {
    fn();
    return [];
  } catch (error) {
    return (error.details || []).map((d) => d.field);
  }
};

describe('productValidator', () => {
  describe('validateCreate - campos simples', () => {
    it('separa os dados do produto das relações', () => {
      const result = productValidator.validateCreate(validProduct({ category_ids: [1, 2, 2] }));

      expect(result.product).toEqual(validProduct());
      expect(result.categoryIds).toEqual([1, 2]); // remove duplicados
      expect(result.images).toBeUndefined();
      expect(result.options).toBeUndefined();
    });

    it('exige name, slug, price e price_with_discount', () => {
      expect(fieldsWithError(() => productValidator.validateCreate({})))
        .toEqual(['name', 'slug', 'price', 'price_with_discount']);
    });

    it.each([
      ['stock negativo', { stock: -1 }, 'stock'],
      ['stock acima do INT', { stock: 3000000000 }, 'stock'],
      ['stock decimal', { stock: 1.5 }, 'stock'],
      ['price negativo', { price: -10 }, 'price'],
      ['price gigante', { price: 1e300 }, 'price'],
      ['price como texto', { price: '10' }, 'price'],
      ['enabled não booleano', { enabled: 'true' }, 'enabled'],
      ['description longa', { description: 'a'.repeat(256) }, 'description'],
      ['category_ids inválido', { category_ids: [1, 'x'] }, 'category_ids'],
    ])('rejeita %s', (_, overrides, field) => {
      expect(fieldsWithError(() => productValidator.validateCreate(validProduct(overrides)))).toEqual([field]);
    });

    it('aceita description null', () => {
      expect(productValidator.validateCreate(validProduct({ description: null })).product.description).toBeNull();
    });
  });

  describe('validateCreate - imagens', () => {
    it.each([
      ['image/png', PNG_BASE64, 'png'],
      ['image/jpeg', JPG_BASE64, 'jpg'],
      ['image/jpg', JPG_BASE64, 'jpg'],
      ['image/gif', GIF_BASE64, 'gif'],
      ['image/webp', WEBP_BASE64, 'webp'],
    ])('aceita %s e detecta a extensão', (type, content, extension) => {
      const { images } = productValidator.validateCreate(validProduct({ images: [{ type, content }] }));

      expect(images).toHaveLength(1);
      expect(images[0]).toMatchObject({ action: 'create', extension });
      expect(Buffer.isBuffer(images[0].buffer)).toBe(true);
    });

    it('aceita base64 com prefixo data URI', () => {
      const content = `data:image/png;base64,${PNG_BASE64}`;
      const { images } = productValidator.validateCreate(validProduct({ images: [{ type: 'image/png', content }] }));
      expect(images[0].extension).toBe('png');
    });

    it.each([
      ['tipo não suportado', { type: 'image/bmp', content: PNG_BASE64 }, 'images[0].type'],
      ['chave do prototype', { type: 'constructor', content: PNG_BASE64 }, 'images[0].type'],
      ['__proto__', { type: '__proto__', content: PNG_BASE64 }, 'images[0].type'],
      ['base64 inválido', { type: 'image/png', content: '***' }, 'images[0].content'],
      ['conteúdo que não é imagem', { type: 'image/png', content: TEXT_BASE64 }, 'images[0].content'],
      ['tipo diferente do conteúdo', { type: 'image/gif', content: PNG_BASE64 }, 'images[0].type'],
    ])('rejeita %s', (_, image, field) => {
      expect(fieldsWithError(() => productValidator.validateCreate(validProduct({ images: [image] })))).toEqual([field]);
    });

    it('rejeita imagem maior que 5 MB', () => {
      const big = Buffer.concat([Buffer.from(PNG_BASE64, 'base64'), Buffer.alloc(5 * 1024 * 1024)]).toString('base64');
      expect(fieldsWithError(() => productValidator.validateCreate(validProduct({ images: [{ type: 'image/png', content: big }] }))))
        .toEqual(['images[0].content']);
    });

    it('na criação, ids de imagem são ignorados (toda imagem é nova)', () => {
      const { images } = productValidator.validateCreate(validProduct({ images: [{ id: 5, type: 'image/png', content: PNG_BASE64 }] }));
      expect(images[0].action).toBe('create');
    });
  });

  describe('validateCreate - opções', () => {
    it('normaliza radius "4px", aceita "value" e valores em texto', () => {
      const { options } = productValidator.validateCreate(validProduct({
        options: [
          { title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', value: ['PP', 'GG', 'M'] },
          { title: 'Cor', shape: 'circle', type: 'color', values: '#000,#333' },
          { title: 'Número', values: [38, 39] },
        ],
      }));

      expect(options).toEqual([
        { action: 'create', data: { title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: ['PP', 'GG', 'M'] } },
        { action: 'create', data: { title: 'Cor', shape: 'circle', type: 'color', values: ['#000', '#333'] } },
        { action: 'create', data: { title: 'Número', values: ['38', '39'] } },
      ]);
    });

    it.each([
      ['sem title', { values: ['P'] }, ['options[0].title']],
      ['sem values', { title: 'T' }, ['options[0].values']],
      ['values vazio', { title: 'T', values: [] }, ['options[0].values']],
      ['valor com vírgula', { title: 'T', values: ['P,M'] }, ['options[0].values']],
      ['shape inválido', { title: 'T', values: ['P'], shape: 'triangle' }, ['options[0].shape']],
      ['type inválido', { title: 'T', values: ['P'], type: 'number' }, ['options[0].type']],
      ['radius inválido', { title: 'T', values: ['P'], radius: '4em' }, ['options[0].radius']],
      ['radius muito grande', { title: 'T', values: ['P'], radius: '99999999999px' }, ['options[0].radius']],
    ])('rejeita opção %s', (_, option, fields) => {
      expect(fieldsWithError(() => productValidator.validateCreate(validProduct({ options: [option] })))).toEqual(fields);
    });

    it('exige que images e options sejam arrays', () => {
      expect(fieldsWithError(() => productValidator.validateCreate(validProduct({ images: {}, options: 'x' }))))
        .toEqual(['images', 'options']);
    });
  });

  describe('validateUpdate', () => {
    it('aceita atualização parcial', () => {
      expect(productValidator.validateUpdate({ stock: 5 }).product).toEqual({ stock: 5 });
    });

    it('exige ao menos um campo', () => {
      expect(fieldsWithError(() => productValidator.validateUpdate({}))).toEqual(['body']);
    });

    it('converte cada item de images na operação correta', () => {
      const { images } = productValidator.validateUpdate({
        images: [
          { type: 'image/png', content: PNG_BASE64 },
          { id: 2, deleted: true },
          { id: 3, content: PNG_BASE64 },
          { id: 1, content: 'https://store.com/media/product-01/image-01.jpg' },
        ],
      });

      expect(images.map(({ action, id, extension }) => ({ action, id, extension }))).toEqual([
        { action: 'create', id: undefined, extension: 'png' },
        { action: 'delete', id: 2, extension: undefined },
        { action: 'replace', id: 3, extension: 'png' }, // sem type: detecta pelo conteúdo
        { action: 'keep', id: 1, extension: undefined },
      ]);
    });

    it('converte cada item de options na operação correta', () => {
      const { options } = productValidator.validateUpdate({
        options: [
          { id: 1, deleted: true },
          { id: 2, radius: '10px', value: ['42/43', '44/45'] },
          { title: 'Tipo', values: ['100% algodão'] },
        ],
      });

      expect(options).toEqual([
        { action: 'delete', id: 1 },
        { action: 'update', id: 2, data: { radius: 10, values: ['42/43', '44/45'] } },
        { action: 'create', data: { title: 'Tipo', values: ['100% algodão'] } },
      ]);
    });

    it('rejeita ids repetidos em images e options', () => {
      expect(fieldsWithError(() => productValidator.validateUpdate({
        images: [{ id: 1, deleted: true }, { id: 1, content: PNG_BASE64 }],
        options: [{ id: 2, deleted: true }, { id: 2, title: 'X' }],
      }))).toEqual(['images[1].id', 'options[1].id']);
    });

    it('rejeita id inválido', () => {
      expect(fieldsWithError(() => productValidator.validateUpdate({ images: [{ id: -1, deleted: true }] })))
        .toEqual(['images[0].id']);
    });
  });
});
