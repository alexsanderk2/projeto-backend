/**
 * Controller de usuários: recebe a requisição, valida a entrada,
 * delega para o service e devolve a resposta HTTP adequada.
 * (No Express 5, erros lançados em funções async são repassados
 * automaticamente para o middleware de erros.)
 */
const userService = require('../services/userService');
const userValidator = require('../validators/userValidator');
const { parseId } = require('../utils/validation');

async function show(req, res) {
  const user = await userService.findById(parseId(req.params.id));
  return res.status(200).json(user);
}

async function store(req, res) {
  const data = userValidator.validateCreate(req.body);
  const user = await userService.create(data);
  return res.status(201).json(user);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  const data = userValidator.validateUpdate(req.body);
  await userService.update(id, data, req.user.id);
  return res.status(204).send();
}

async function destroy(req, res) {
  await userService.remove(parseId(req.params.id), req.user.id);
  return res.status(204).send();
}

async function token(req, res) {
  const credentials = userValidator.validateToken(req.body);
  const result = await userService.generateToken(credentials);
  return res.status(200).json(result);
}

module.exports = { show, store, update, destroy, token };
