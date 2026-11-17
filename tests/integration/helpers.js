/**
 * Utilitários dos testes de integração.
 */
const request = require('supertest');

const app = require('../../src/app');
const { sequelize } = require('../../src/models');
const { validUser } = require('../helpers/fixtures');

const TABLES = ['product_categories', 'product_options', 'product_images', 'products', 'categories', 'users'];

/** Esvazia todas as tabelas e reinicia os auto-increments. */
async function resetDatabase() {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of TABLES) {
    await sequelize.query(`TRUNCATE TABLE ${table}`);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

/** Cadastra um usuário pela API e devolve { user, token, auth }. */
async function createUserAndToken(overrides = {}) {
  const data = validUser(overrides);
  const { body: user } = await request(app).post('/v1/user').send(data).expect(201);
  const { body } = await request(app).post('/v1/user/token').send({ email: data.email, password: data.password }).expect(200);

  return { user, token: body.token, auth: { Authorization: `Bearer ${body.token}` } };
}

module.exports = { app, request, sequelize, resetDatabase, createUserAndToken };
