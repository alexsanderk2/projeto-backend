/**
 * Controller de categorias.
 */
const categoryService = require('../services/categoryService');
const categoryValidator = require('../validators/categoryValidator');
const { parseId } = require('../utils/validation');
const { parsePagination, parseFields, parseBoolean } = require('../utils/queryParams');

async function search(req, res) {
  const result = await categoryService.search({
    pagination: parsePagination(req.query),
    fields: parseFields(req.query.fields, categoryService.ATTRIBUTES),
    useInMenu: parseBoolean(req.query.use_in_menu, 'use_in_menu'),
  });
  return res.status(200).json(result);
}

async function show(req, res) {
  const category = await categoryService.findById(parseId(req.params.id));
  return res.status(200).json(category);
}

async function store(req, res) {
  const data = categoryValidator.validateCreate(req.body);
  const category = await categoryService.create(data);
  return res.status(201).json(category);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  const data = categoryValidator.validateUpdate(req.body);
  await categoryService.update(id, data);
  return res.status(204).send();
}

async function destroy(req, res) {
  await categoryService.remove(parseId(req.params.id));
  return res.status(204).send();
}

module.exports = { search, show, store, update, destroy };
