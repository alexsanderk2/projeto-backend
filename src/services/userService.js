/**
 * Regras de negócio de usuários e autenticação.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const env = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;
// Hash usado quando o e-mail não existe, para que o tempo de resposta do login
// seja parecido nos dois casos (dificulta descobrir e-mails cadastrados)
const DUMMY_HASH = bcrypt.hashSync('senha-inexistente', SALT_ROUNDS);
const PUBLIC_ATTRIBUTES = ['id', 'firstname', 'surname', 'email'];

/** Busca um usuário pelo ID ou lança 404. */
async function findById(id) {
  const user = await User.findByPk(id, { attributes: PUBLIC_ATTRIBUTES });
  if (!user) throw AppError.notFound('Usuário não encontrado');
  return user;
}

/** Garante que o e-mail não esteja em uso por outro usuário. */
async function ensureEmailIsAvailable(email, ignoreId = null) {
  const where = { email };
  if (ignoreId) where.id = { [Op.ne]: ignoreId };

  const exists = await User.count({ where });
  if (exists) throw AppError.badRequest('Este email já está cadastrado');
}

/** Cadastra um novo usuário armazenando o hash da senha. */
async function create(data) {
  await ensureEmailIsAvailable(data.email);

  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({ ...data, password });

  return { id: user.id, firstname: user.firstname, surname: user.surname, email: user.email };
}

/**
 * Atualiza os dados de um usuário.
 * Um usuário autenticado só pode alterar a própria conta.
 */
async function update(id, data, authUserId) {
  const user = await findById(id);
  if (user.id !== authUserId) throw AppError.forbidden('Você só pode alterar a sua própria conta');

  if (data.email && data.email !== user.email) {
    await ensureEmailIsAvailable(data.email, id);
  }

  await user.update(data);
}

/** Remove um usuário. Um usuário autenticado só pode excluir a própria conta. */
async function remove(id, authUserId) {
  const user = await findById(id);
  if (user.id !== authUserId) throw AppError.forbidden('Você só pode excluir a sua própria conta');

  await user.destroy();
}

/** Valida as credenciais e gera um token JWT. */
async function generateToken({ email, password }) {
  const user = await User.scope('withPassword').findOne({ where: { email } });

  // Sempre executa o bcrypt e usa a mesma mensagem para e-mail ou senha incorretos
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !valid) throw AppError.badRequest('Email ou senha inválidos');

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: env.jwt.expiresIn,
  });

  return { token };
}

module.exports = { findById, create, update, remove, generateToken };
