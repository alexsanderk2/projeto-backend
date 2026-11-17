const {
  app, request, sequelize, resetDatabase, createUserAndToken,
} = require('./helpers');
const { validUser } = require('../helpers/fixtures');

describe('Usuários e autenticação (/v1/user)', () => {
  beforeEach(resetDatabase);
  afterAll(() => sequelize.close());

  describe('POST /v1/user', () => {
    it('201 - cadastra o usuário sem devolver a senha', async () => {
      const res = await request(app).post('/v1/user').send(validUser()).expect(201);

      expect(res.body).toEqual({ id: 1, firstname: 'Ana', surname: 'Silva', email: 'ana@mail.com' });

      const [[row]] = await sequelize.query('SELECT password FROM users WHERE id = 1');
      expect(row.password).toMatch(/^\$2[aby]\$/); // hash bcrypt
    });

    it('400 - dados inválidos', async () => {
      const res = await request(app).post('/v1/user').send({ email: 'x' }).expect(400);
      expect(res.body.details.map((d) => d.field)).toEqual(['firstname', 'surname', 'email', 'password']);
    });

    it('400 - e-mail já cadastrado', async () => {
      await request(app).post('/v1/user').send(validUser()).expect(201);
      await request(app).post('/v1/user').send(validUser({ email: 'ANA@mail.com' })).expect(400);
    });

    it('400 - JSON malformado', async () => {
      await request(app).post('/v1/user').set('Content-Type', 'application/json').send('{"x":').expect(400);
    });
  });

  describe('GET /v1/user/:id', () => {
    it('200 - retorna o usuário', async () => {
      const { user } = await createUserAndToken();
      const res = await request(app).get(`/v1/user/${user.id}`).expect(200);
      expect(res.body).toEqual(user);
    });

    it('404 - usuário inexistente', () => request(app).get('/v1/user/999').expect(404));
    it('400 - id inválido', () => request(app).get('/v1/user/abc').expect(400));
  });

  describe('POST /v1/user/token', () => {
    it('200 - gera o token com credenciais válidas', async () => {
      const { token } = await createUserAndToken();
      expect(token.split('.')).toHaveLength(3);
    });

    it('400 - senha incorreta', async () => {
      await createUserAndToken();
      const res = await request(app).post('/v1/user/token').send({ email: 'ana@mail.com', password: 'errada' }).expect(400);
      expect(res.body.message).toBe('Email ou senha inválidos');
    });

    it('400 - e-mail inexistente', () => (
      request(app).post('/v1/user/token').send({ email: 'nao@existe.com', password: '123@123' }).expect(400)
    ));
  });

  describe('PUT /v1/user/:id', () => {
    it('204 - atualiza a própria conta', async () => {
      const { user, auth } = await createUserAndToken();

      const res = await request(app).put(`/v1/user/${user.id}`).set(auth).send({ firstname: 'Ana Maria' }).expect(204);
      expect(res.text).toBe('');

      const { body } = await request(app).get(`/v1/user/${user.id}`);
      expect(body.firstname).toBe('Ana Maria');
    });

    it('401 - sem token', async () => {
      const { user } = await createUserAndToken();
      await request(app).put(`/v1/user/${user.id}`).send({ firstname: 'X' }).expect(401);
    });

    it('403 - conta de outro usuário', async () => {
      const { auth } = await createUserAndToken();
      const { user: other } = await createUserAndToken({ email: 'bia@mail.com' });

      await request(app).put(`/v1/user/${other.id}`).set(auth).send({ firstname: 'X' }).expect(403);
    });

    it('400 - dados inválidos', async () => {
      const { user, auth } = await createUserAndToken();
      await request(app).put(`/v1/user/${user.id}`).set(auth).send({ email: 'invalido' }).expect(400);
    });

    it('404 - usuário inexistente', async () => {
      const { auth } = await createUserAndToken();
      await request(app).put('/v1/user/999').set(auth).send({ firstname: 'X' }).expect(404);
    });
  });

  describe('DELETE /v1/user/:id', () => {
    it('204 - exclui a própria conta e o token deixa de valer', async () => {
      const { user, auth } = await createUserAndToken();

      await request(app).delete(`/v1/user/${user.id}`).set(auth).expect(204);
      await request(app).get(`/v1/user/${user.id}`).expect(404);
      await request(app).post('/v1/category').set(auth).send({ name: 'A', slug: 'a' }).expect(401);
    });

    it('401 - token inválido', async () => {
      const { user } = await createUserAndToken();
      await request(app).delete(`/v1/user/${user.id}`).set('Authorization', 'Bearer invalido').expect(401);
    });

    it('404 - usuário inexistente', async () => {
      const { auth } = await createUserAndToken();
      await request(app).delete('/v1/user/999').set(auth).expect(404);
    });
  });

  it('404 - rota inexistente', () => request(app).get('/v1/nada').expect(404));
});
