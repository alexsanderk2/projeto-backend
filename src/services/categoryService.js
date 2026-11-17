/**
 * Regras de negócio de categorias.
 */
const { Category } = require('../models');
const AppError = require('../utils/AppError');

const ATTRIBUTES = ['id', 'name', 'slug', 'use_in_menu'];

/**
 * Lista categorias com paginação, filtro e seleção de campos.
 * Usa findAndCountAll para obter os dados e o total em uma única chamada.
 */
async function search({ pagination, fields, useInMenu }) {
  const where = {};
  if (useInMenu !== undefined) where.use_in_menu = useInMenu;

  const { rows, count } = await Category.findAndCountAll({
    where,
    attributes: fields || ATTRIBUTES,
    order: [['id', 'ASC']],
    limit: pagination.sqlLimit,
    offset: pagination.offset,
  });

  return { data: rows, total: count, limit: pagination.limit, page: pagination.page };
}

/** Busca uma categoria pelo ID ou lança 404. */
async function findById(id) {
  const category = await Category.findByPk(id, { attributes: ATTRIBUTES });
  if (!category) throw AppError.notFound('Categoria não encontrada');
  return category;
}

/** Garante que o slug não esteja em uso por outra categoria. */
async function ensureSlugIsAvailable(slug, ignoreId = null) {
  const existing = await Category.findOne({ where: { slug }, attributes: ['id'] });
  if (existing && existing.id !== ignoreId) {
    throw AppError.badRequest('Já existe uma categoria com este slug');
  }
}

async function create(data) {
  await ensureSlugIsAvailable(data.slug);
  const category = await Category.create(data);
  return { id: category.id, name: category.name, slug: category.slug, use_in_menu: category.use_in_menu };
}

async function update(id, data) {
  const category = await findById(id);
  if (data.slug) await ensureSlugIsAvailable(data.slug, id);
  await category.update(data);
}

async function remove(id) {
  const category = await findById(id);
  // As associações em product_categories são removidas via ON DELETE CASCADE
  await category.destroy();
}

module.exports = { search, findById, create, update, remove, ATTRIBUTES };
