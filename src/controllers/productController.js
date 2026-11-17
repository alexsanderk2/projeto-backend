/**
 * Controller de produtos.
 */
const productService = require('../services/productService');
const productValidator = require('../validators/productValidator');
const { parseSearchQuery } = require('../validators/productSearchValidator');
const { parseId } = require('../utils/validation');

async function search(req, res) {
  const result = await productService.search(parseSearchQuery(req.query));
  return res.status(200).json(result);
}

async function show(req, res) {
  const product = await productService.findById(parseId(req.params.id));
  return res.status(200).json(product);
}

async function store(req, res) {
  const data = productValidator.validateCreate(req.body);
  const product = await productService.create(data);
  return res.status(201).json(product);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  const data = productValidator.validateUpdate(req.body);
  await productService.update(id, data);
  return res.status(204).send();
}

async function destroy(req, res) {
  await productService.remove(parseId(req.params.id));
  return res.status(204).send();
}

module.exports = { search, show, store, update, destroy };
