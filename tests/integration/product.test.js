const fs = require('fs');
const path = require('path');

const {
  app, request, sequelize, resetDatabase, createUserAndToken,
} = require('./helpers');
const env = require('../../src/config/env');
const { PNG_BASE64, JPG_BASE64, validProduct } = require('../helpers/fixtures');

/** Converte a URL pública de uma imagem no caminho do arquivo em disco. */
const fileFromUrl = (url) => path.join(env.mediaDir, url.split('/media/')[1]);

describe('Produtos (/v1/product)', () => {
  let auth;

  const createProduct = (data) => request(app).post('/v1/product').set(auth).send(validProduct(data)).expect(201);
  const getProduct = async (id) => (await request(app).get(`/v1/product/${id}`).expect(200)).body;

  beforeEach(async () => {
    await resetDatabase();
    fs.rmSync(env.mediaDir, { recursive: true, force: true });
    ({ auth } = await createUserAndToken());

    for (const [name, slug] of [['Tênis', 'tenis'], ['Camisetas', 'camisetas'], ['Ofertas', 'ofertas']]) {
      await request(app).post('/v1/category').set(auth).send({ name, slug }).expect(201);
    }
  });

  afterAll(async () => {
    fs.rmSync(env.mediaDir, { recursive: true, force: true });
    await sequelize.close();
  });

  describe('POST /v1/product', () => {
    it('201 - cadastra o produto com categorias, imagens e opções', async () => {
      const res = await createProduct({
        category_ids: [1, 3],
        images: [
          { type: 'image/png', content: PNG_BASE64 },
          { type: 'image/jpg', content: JPG_BASE64 },
        ],
        options: [
          { title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', value: ['PP', 'GG', 'M'] },
          { title: 'Cor', shape: 'circle', type: 'color', values: ['#000', '#333'] },
        ],
      });

      expect(res.body).toEqual({
        id: 1,
        enabled: true,
        name: 'Tênis Runner',
        slug: 'tenis-runner',
        use_in_menu: false,
        stock: 10,
        description: 'Tênis de corrida leve',
        price: 119.9,
        price_with_discount: 99.9,
        category_ids: [1, 3],
        images: [
          { id: 1, content: expect.stringMatching(/^http.+\/media\/products\/1\/.+\.png$/) },
          { id: 2, content: expect.stringMatching(/^http.+\/media\/products\/1\/.+\.jpg$/) },
        ],
        options: [
          { id: 1, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: ['PP', 'GG', 'M'] },
          { id: 2, title: 'Cor', shape: 'circle', radius: 0, type: 'color', values: ['#000', '#333'] },
        ],
      });

      // Os arquivos existem no disco e são servidos em /media
      res.body.images.forEach((image) => expect(fs.existsSync(fileFromUrl(image.content))).toBe(true));
      const imagePath = new URL(res.body.images[0].content).pathname;
      await request(app).get(imagePath).expect(200).expect('Content-Type', 'image/png');
    });

    it('aplica os valores padrão do banco', async () => {
      const res = await request(app).post('/v1/product').set(auth)
        .send({ name: 'Simples', slug: 'simples', price: 10, price_with_discount: 9 }).expect(201);

      expect(res.body).toMatchObject({
        enabled: false, use_in_menu: false, stock: 0, description: null, category_ids: [], images: [], options: [],
      });
    });

    it('400 - dados inválidos', async () => {
      const res = await request(app).post('/v1/product').set(auth).send({ name: 'X' }).expect(400);
      expect(res.body.details.map((d) => d.field)).toEqual(['slug', 'price', 'price_with_discount']);
    });

    it('400 - categoria inexistente (nada é salvo)', async () => {
      await request(app).post('/v1/product').set(auth).send(validProduct({ category_ids: [1, 99] })).expect(400);
      const [[{ total }]] = await sequelize.query('SELECT COUNT(*) AS total FROM products');
      expect(total).toBe(0);
    });

    it('400 - slug duplicado', async () => {
      await createProduct();
      await request(app).post('/v1/product').set(auth).send(validProduct()).expect(400);
    });

    it('400 - imagem que não corresponde ao tipo informado', () => (
      request(app).post('/v1/product').set(auth)
        .send(validProduct({ images: [{ type: 'image/png', content: JPG_BASE64 }] })).expect(400)
    ));

    it('401 - sem token', () => request(app).post('/v1/product').send(validProduct()).expect(401));
  });

  describe('GET /v1/product/:id', () => {
    it('200 - retorna o produto', async () => {
      const { body: created } = await createProduct({ category_ids: [2] });
      expect(await getProduct(created.id)).toEqual(created);
    });

    it('404 - produto inexistente', () => request(app).get('/v1/product/999').expect(404));
  });

  describe('PUT /v1/product/:id', () => {
    let product;

    beforeEach(async () => {
      ({ body: product } = await createProduct({
        category_ids: [1, 2],
        images: [
          { type: 'image/png', content: PNG_BASE64 },
          { type: 'image/png', content: PNG_BASE64 },
          { type: 'image/png', content: PNG_BASE64 },
        ],
        options: [
          { title: 'Cor', values: ['Preto'] },
          { title: 'Tamanho', values: ['38', '39'] },
        ],
      }));
    });

    it('204 - aplica o payload completo do enunciado', async () => {
      const [img1, img2, img3] = product.images;

      const res = await request(app).put(`/v1/product/${product.id}`).set(auth).send({
        enabled: true,
        name: 'Produto 01 atualizado',
        slug: 'produto-01-atualizado',
        stock: 20,
        description: 'Descrição do produto 01 atualizado',
        price: 49.9,
        price_with_discount: 0,
        category_ids: [3],
        images: [
          { type: 'image/png', content: PNG_BASE64 }, // nova
          { id: img2.id, deleted: true }, // removida
          { id: img3.id, content: JPG_BASE64 }, // substituída
          { id: img1.id, content: img1.content }, // mantida
        ],
        options: [
          { id: 1, deleted: true },
          { id: 2, radius: '10px', value: ['42/43', '44/45'] },
          { title: 'Tipo', shape: 'square', type: 'text', values: ['100% algodão', '65% algodão'] },
        ],
      }).expect(204);

      expect(res.text).toBe('');

      const updated = await getProduct(product.id);
      expect(updated).toMatchObject({
        name: 'Produto 01 atualizado', slug: 'produto-01-atualizado', stock: 20, price: 49.9, price_with_discount: 0,
        category_ids: [3],
        options: [
          { id: 2, title: 'Tamanho', radius: 10, values: ['42/43', '44/45'] },
          { id: 3, title: 'Tipo', values: ['100% algodão', '65% algodão'] },
        ],
      });

      // Imagens: 1 mantida, 3 substituída (agora .jpg), 2 removida, 4 nova
      expect(updated.images.map((i) => i.id)).toEqual([img1.id, img3.id, 4]);
      expect(updated.images[0].content).toBe(img1.content);
      expect(updated.images[1].content).toMatch(/\.jpg$/);

      // Arquivos removidos/substituídos saem do disco
      expect(fs.existsSync(fileFromUrl(img2.content))).toBe(false);
      expect(fs.existsSync(fileFromUrl(img3.content))).toBe(false);
      updated.images.forEach((image) => expect(fs.existsSync(fileFromUrl(image.content))).toBe(true));
    });

    it('atualiza só os campos enviados', async () => {
      await request(app).put(`/v1/product/${product.id}`).set(auth).send({ stock: 3 }).expect(204);
      const updated = await getProduct(product.id);

      expect(updated).toEqual({ ...product, stock: 3 });
    });

    it('400 - imagem de outro produto (nada é alterado)', async () => {
      const filesBefore = fs.readdirSync(path.join(env.mediaDir, 'products', '1'));

      await request(app).put(`/v1/product/${product.id}`).set(auth).send({
        name: 'Não deve salvar',
        images: [{ type: 'image/png', content: PNG_BASE64 }, { id: 999, deleted: true }],
      }).expect(400);

      expect(await getProduct(product.id)).toEqual(product);
      // a imagem nova gravada antes do erro é descartada
      expect(fs.readdirSync(path.join(env.mediaDir, 'products', '1'))).toEqual(filesBefore);
    });

    it('400 - opção de outro produto', () => (
      request(app).put(`/v1/product/${product.id}`).set(auth).send({ options: [{ id: 999, deleted: true }] }).expect(400)
    ));

    it('400 - corpo vazio', () => request(app).put(`/v1/product/${product.id}`).set(auth).send({}).expect(400));
    it('401 - sem token', () => request(app).put(`/v1/product/${product.id}`).send({ stock: 1 }).expect(401));
    it('404 - produto inexistente', () => request(app).put('/v1/product/999').set(auth).send({ stock: 1 }).expect(404));
  });

  describe('DELETE /v1/product/:id', () => {
    it('204 - exclui o produto, suas relações e as imagens', async () => {
      const { body: product } = await createProduct({
        category_ids: [1],
        images: [{ type: 'image/png', content: PNG_BASE64 }],
        options: [{ title: 'Cor', values: ['Preto'] }],
      });

      await request(app).delete(`/v1/product/${product.id}`).set(auth).expect(204);
      await request(app).get(`/v1/product/${product.id}`).expect(404);

      const [[counts]] = await sequelize.query(`SELECT
        (SELECT COUNT(*) FROM product_images) AS images,
        (SELECT COUNT(*) FROM product_options) AS options,
        (SELECT COUNT(*) FROM product_categories) AS categories`);
      expect(counts).toEqual({ images: 0, options: 0, categories: 0 });
      expect(fs.existsSync(path.join(env.mediaDir, 'products', String(product.id)))).toBe(false);
    });

    it('401 - sem token', async () => {
      const { body: product } = await createProduct();
      await request(app).delete(`/v1/product/${product.id}`).expect(401);
    });

    it('404 - produto inexistente', () => request(app).delete('/v1/product/999').set(auth).expect(404));
  });

  describe('GET /v1/product/search', () => {
    const search = async (query = '') => (await request(app).get(`/v1/product/search?${query}`).expect(200)).body;
    const ids = async (query) => (await search(`fields=id&${query}`)).data.map((p) => p.id);

    beforeEach(async () => {
      await createProduct({
        name: 'Tênis Runner', slug: 'tenis-runner', price: 219.9, category_ids: [1, 3],
        options: [{ title: 'Tamanho', values: ['39', '40', '41'] }],
      });
      await createProduct({
        name: 'Tênis Casual', slug: 'tenis-casual', description: 'Para o dia a dia', price: 149.9, category_ids: [1],
        options: [{ title: 'Tamanho', values: ['38', '39'] }],
      });
      await createProduct({
        name: 'Camiseta Básica', slug: 'camiseta-basica', description: '100% algodão', price: 59.9, category_ids: [2, 3],
        options: [{ title: 'Tamanho', values: ['P', 'M', 'G'] }, { title: 'Cor', type: 'color', values: ['#000'] }],
      });
    });

    it('200 - formato de resposta padrão', async () => {
      const body = await search();

      expect(body).toMatchObject({ total: 3, limit: 12, page: 1 });
      expect(body.data).toHaveLength(3);
      expect(Object.keys(body.data[0])).toEqual([
        'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
        'price', 'price_with_discount', 'category_ids', 'images', 'options',
      ]);
    });

    it('fields limita os campos retornados', async () => {
      const body = await search('fields=name,price,category_ids');
      expect(body.data[0]).toEqual({ name: 'Tênis Runner', price: 219.9, category_ids: [1, 3] });
    });

    it('pagina mantendo o total', async () => {
      const body = await search('limit=2&page=2&fields=id');
      expect(body).toEqual({ data: [{ id: 3 }], total: 3, limit: 2, page: 2 });
    });

    it('limit=-1 retorna todos', async () => {
      const body = await search('limit=-1&page=9&fields=id');
      expect(body).toMatchObject({ total: 3, limit: -1, page: 1 });
      expect(body.data).toHaveLength(3);
    });

    it('match busca no nome e na descrição', async () => {
      expect(await ids('match=Tênis')).toEqual([1, 2]);
      expect(await ids('match=algodão')).toEqual([3]);
      expect(await ids('match=100%25')).toEqual([3]); // "%" é buscado literalmente
    });

    it('category_ids filtra por qualquer uma das categorias', async () => {
      expect(await ids('category_ids=2')).toEqual([3]);
      expect(await ids('category_ids=2,3')).toEqual([1, 3]);
    });

    it('price-range inclui os valores das bordas', async () => {
      expect(await ids('price-range=100-200')).toEqual([2]);
      expect(await ids('price-range=59.9-149.9')).toEqual([2, 3]);
      expect(await ids('price-range=219.9-219.9')).toEqual([1]);
    });

    it('option[id] filtra pelos valores da opção', async () => {
      expect(await ids('option[1]=40,99')).toEqual([1]);
      expect(await ids('option[1]=38')).toEqual([]); // opção 1 é do produto 1
    });

    it('option[título] filtra entre todos os produtos', async () => {
      expect(await ids('option[Tamanho]=39')).toEqual([1, 2]);
      expect(await ids('option[Tamanho]=M&option[Cor]=%23000')).toEqual([3]);
      expect(await ids('option[Tamanho]=3')).toEqual([]); // valor exato, não parcial
    });

    it('combina filtros', async () => {
      const body = await search('match=Tênis&category_ids=3&price-range=200-300&option[Tamanho]=41&fields=id,name');
      expect(body).toEqual({ data: [{ id: 1, name: 'Tênis Runner' }], total: 1, limit: 12, page: 1 });
    });

    it.each([
      ['limit=0'], ['limit=101'], ['page=0'], ['page=100000000000000000000'], ['fields=senha'],
      ['category_ids=abc'], ['price-range=200-100'], ['price-range=abc'],
    ])('400 - %s', (query) => request(app).get(`/v1/product/search?${query}`).expect(400));
  });
});
