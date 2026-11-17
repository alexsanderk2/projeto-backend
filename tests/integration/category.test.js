const {
  app, request, sequelize, resetDatabase, createUserAndToken,
} = require('./helpers');

describe('Categorias (/v1/category)', () => {
  let auth;

  const createCategory = (data) => request(app).post('/v1/category').set(auth).send(data).expect(201);

  beforeEach(async () => {
    await resetDatabase();
    ({ auth } = await createUserAndToken());
  });

  afterAll(() => sequelize.close());

  describe('POST /v1/category', () => {
    it('201 - cadastra a categoria', async () => {
      const res = await createCategory({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
      expect(res.body).toEqual({ id: 1, name: 'Shoes', slug: 'shoes', use_in_menu: true });
    });

    it('use_in_menu é false por padrão', async () => {
      const res = await createCategory({ name: 'Offers', slug: 'offers' });
      expect(res.body.use_in_menu).toBe(false);
    });

    it('400 - dados inválidos', () => request(app).post('/v1/category').set(auth).send({ name: '' }).expect(400));

    it('400 - slug duplicado', async () => {
      await createCategory({ name: 'Shoes', slug: 'shoes' });
      await request(app).post('/v1/category').set(auth).send({ name: 'Outra', slug: 'shoes' }).expect(400);
    });

    it('401 - sem token', () => request(app).post('/v1/category').send({ name: 'A', slug: 'a' }).expect(401));
  });

  describe('GET /v1/category/search', () => {
    beforeEach(async () => {
      await createCategory({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
      await createCategory({ name: 'Offers', slug: 'offers', use_in_menu: true });
      await createCategory({ name: 'Black Friday', slug: 'black-friday', use_in_menu: false });
    });

    it('200 - lista com paginação padrão', async () => {
      const res = await request(app).get('/v1/category/search').expect(200);

      expect(res.body).toEqual({
        data: [
          { id: 1, name: 'Shoes', slug: 'shoes', use_in_menu: true },
          { id: 2, name: 'Offers', slug: 'offers', use_in_menu: true },
          { id: 3, name: 'Black Friday', slug: 'black-friday', use_in_menu: false },
        ],
        total: 3,
        limit: 12,
        page: 1,
      });
    });

    it('pagina os resultados mantendo o total', async () => {
      const res = await request(app).get('/v1/category/search?limit=2&page=2').expect(200);
      expect(res.body).toMatchObject({ data: [{ id: 3 }], total: 3, limit: 2, page: 2 });
    });

    it('limit=-1 com fields e use_in_menu', async () => {
      const res = await request(app).get('/v1/category/search?limit=-1&fields=name,slug&use_in_menu=true').expect(200);

      expect(res.body).toEqual({
        data: [{ name: 'Shoes', slug: 'shoes' }, { name: 'Offers', slug: 'offers' }],
        total: 2,
        limit: -1,
        page: 1,
      });
    });

    it.each([['limit=0'], ['page=0'], ['fields=senha'], ['use_in_menu=talvez']])('400 - %s', (query) => (
      request(app).get(`/v1/category/search?${query}`).expect(400)
    ));
  });

  describe('GET /v1/category/:id', () => {
    it('200 - retorna a categoria', async () => {
      await createCategory({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
      const res = await request(app).get('/v1/category/1').expect(200);
      expect(res.body).toEqual({ id: 1, name: 'Shoes', slug: 'shoes', use_in_menu: true });
    });

    it('404 - categoria inexistente', () => request(app).get('/v1/category/999').expect(404));
  });

  describe('PUT /v1/category/:id', () => {
    beforeEach(() => createCategory({ name: 'Shoes', slug: 'shoes' }));

    it('204 - atualiza a categoria', async () => {
      await request(app).put('/v1/category/1').set(auth).send({ use_in_menu: true, name: 'Tênis' }).expect(204);
      const { body } = await request(app).get('/v1/category/1');
      expect(body).toMatchObject({ name: 'Tênis', use_in_menu: true });
    });

    it('400 - dados inválidos', () => request(app).put('/v1/category/1').set(auth).send({ slug: 'Com Espaço' }).expect(400));
    it('401 - sem token', () => request(app).put('/v1/category/1').send({ name: 'X' }).expect(401));
    it('404 - categoria inexistente', () => request(app).put('/v1/category/999').set(auth).send({ name: 'X' }).expect(404));
  });

  describe('DELETE /v1/category/:id', () => {
    beforeEach(() => createCategory({ name: 'Shoes', slug: 'shoes' }));

    it('204 - exclui a categoria', async () => {
      await request(app).delete('/v1/category/1').set(auth).expect(204);
      await request(app).get('/v1/category/1').expect(404);
    });

    it('401 - sem token', () => request(app).delete('/v1/category/1').expect(401));
    it('404 - categoria inexistente', () => request(app).delete('/v1/category/999').set(auth).expect(404));
  });
});
