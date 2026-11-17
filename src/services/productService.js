/**
 * Regras de negócio de produtos.
 *
 * Estratégia de consulta (evita N+1 e problemas de LIMIT com JOINs):
 *  1. Busca os produtos da página (com filtros) e o total em findAndCountAll;
 *  2. Carrega categorias, imagens e opções de TODOS os produtos da página com
 *     no máximo uma consulta por relação (WHERE product_id IN (...)), e só
 *     quando o campo foi solicitado.
 */
const { Op } = require('sequelize');

const {
  sequelize, Product, ProductImage, ProductOption, ProductCategory, Category,
} = require('../models');
const AppError = require('../utils/AppError');
const imageStorage = require('./imageStorage');

// Colunas da tabela products (os demais campos da resposta vêm de relações)
const COLUMN_FIELDS = [
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount',
];
const RELATION_FIELDS = ['category_ids', 'images', 'options'];
const ALL_FIELDS = [...COLUMN_FIELDS, ...RELATION_FIELDS];

/* -------------------------------------------------------------------------- */
/*                            Montagem da resposta                            */
/* -------------------------------------------------------------------------- */

// FLOAT no MySQL tem precisão simples; arredonda para 2 casas na resposta
const toMoney = (value) => (value === null || value === undefined ? value : Math.round(value * 100) / 100);

/** Agrupa uma lista de linhas por product_id. */
function groupByProduct(rows, mapper) {
  return rows.reduce((map, row) => {
    const list = map.get(row.product_id) || [];
    list.push(mapper(row));
    map.set(row.product_id, list);
    return map;
  }, new Map());
}

/** Carrega as relações solicitadas para um conjunto de produtos. */
async function loadRelations(productIds, fields) {
  const wants = (field) => fields.includes(field);
  const where = { product_id: { [Op.in]: productIds } };
  const empty = new Map();

  if (productIds.length === 0) return { categories: empty, images: empty, options: empty };

  const [categories, images, options] = await Promise.all([
    wants('category_ids')
      ? ProductCategory.findAll({ where, attributes: ['product_id', 'category_id'], order: [['category_id', 'ASC']], raw: true })
      : [],
    wants('images')
      ? ProductImage.findAll({ where, attributes: ['id', 'product_id', 'path'], order: [['id', 'ASC']], raw: true })
      : [],
    wants('options')
      ? ProductOption.findAll({ where, order: [['id', 'ASC']] })
      : [],
  ]);

  return {
    categories: groupByProduct(categories, (row) => row.category_id),
    images: groupByProduct(images, (row) => ({ id: row.id, content: imageStorage.toUrl(row.path) })),
    options: groupByProduct(options, (option) => ({
      id: option.id,
      title: option.title,
      shape: option.shape,
      radius: option.radius,
      type: option.type,
      values: option.values,
    })),
  };
}

/** Converte um produto + relações no formato de resposta da API. */
function format(product, relations, fields) {
  const full = {
    id: product.id,
    enabled: product.enabled,
    name: product.name,
    slug: product.slug,
    use_in_menu: product.use_in_menu,
    stock: product.stock,
    description: product.description,
    price: toMoney(product.price),
    price_with_discount: toMoney(product.price_with_discount),
    category_ids: relations.categories.get(product.id) || [],
    images: relations.images.get(product.id) || [],
    options: relations.options.get(product.id) || [],
  };

  return Object.fromEntries(fields.map((field) => [field, full[field]]));
}

/* -------------------------------------------------------------------------- */
/*                                    Busca                                   */
/* -------------------------------------------------------------------------- */

/** Escapa curingas do LIKE para que o termo seja buscado literalmente. */
const escapeLike = (term) => term.replace(/[\\%_]/g, '\\$&');

/** Monta o WHERE da busca a partir dos filtros (cada filtro relacional vira uma subconsulta indexada). */
function buildSearchWhere({ match, categoryIds, priceRange, options }) {
  const conditions = [];

  if (match) {
    const like = { [Op.like]: `%${escapeLike(match)}%` };
    conditions.push({ [Op.or]: [{ name: like }, { description: like }] });
  }

  if (categoryIds) {
    // IDs já validados como inteiros, seguros para interpolar
    conditions.push({
      id: {
        [Op.in]: sequelize.literal(
          `(SELECT product_id FROM product_categories WHERE category_id IN (${categoryIds.join(',')}))`,
        ),
      },
    });
  }

  if (priceRange) {
    conditions.push({ price: { [Op.between]: [priceRange.min, priceRange.max] } });
  }

  options.forEach(({ key, values }) => {
    const keyCondition = typeof key === 'number' ? `id = ${key}` : `title = ${sequelize.escape(key)}`;
    // FIND_IN_SET compara cada valor exato dentro da string "P,M,G"
    const valuesCondition = values.map((v) => `FIND_IN_SET(${sequelize.escape(v)}, \`values\`)`).join(' OR ');

    conditions.push({
      id: {
        [Op.in]: sequelize.literal(
          `(SELECT product_id FROM product_options WHERE ${keyCondition} AND (${valuesCondition}))`,
        ),
      },
    });
  });

  return conditions.length > 0 ? { [Op.and]: conditions } : {};
}

/** Lista produtos com paginação, filtros e seleção de campos. */
async function search({ pagination, fields, ...filters }) {
  const selected = fields || ALL_FIELDS;
  // id é sempre buscado para relacionar com as tabelas filhas
  const attributes = ['id', ...COLUMN_FIELDS.filter((f) => f !== 'id' && selected.includes(f))];

  const { rows, count } = await Product.findAndCountAll({
    where: buildSearchWhere(filters),
    attributes,
    order: [['id', 'ASC']],
    limit: pagination.sqlLimit,
    offset: pagination.offset,
  });

  const relations = await loadRelations(rows.map((p) => p.id), selected);

  return {
    data: rows.map((product) => format(product, relations, selected)),
    total: count,
    limit: pagination.limit,
    page: pagination.page,
  };
}

/** Busca um produto completo pelo ID ou lança 404. */
async function findById(id) {
  const product = await Product.findByPk(id, { attributes: COLUMN_FIELDS });
  if (!product) throw AppError.notFound('Produto não encontrado');

  const relations = await loadRelations([product.id], ALL_FIELDS);
  return format(product, relations, ALL_FIELDS);
}

/* -------------------------------------------------------------------------- */
/*                                   Escrita                                  */
/* -------------------------------------------------------------------------- */

async function ensureSlugIsAvailable(slug, ignoreId = null) {
  const existing = await Product.findOne({ where: { slug }, attributes: ['id'] });
  if (existing && existing.id !== ignoreId) {
    throw AppError.badRequest('Já existe um produto com este slug');
  }
}

/** Garante que todas as categorias informadas existem (uma única consulta). */
async function ensureCategoriesExist(categoryIds) {
  if (!categoryIds || categoryIds.length === 0) return;

  const found = await Category.findAll({ where: { id: { [Op.in]: categoryIds } }, attributes: ['id'], raw: true });
  const foundIds = new Set(found.map((c) => c.id));
  const missing = categoryIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw AppError.badRequest(`Categorias não encontradas: ${missing.join(', ')}`);
  }
}

/** Substitui as categorias do produto. */
async function syncCategories(productId, categoryIds, transaction) {
  await ProductCategory.destroy({ where: { product_id: productId }, transaction });
  if (categoryIds.length === 0) return;

  await ProductCategory.bulkCreate(
    categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId })),
    { transaction },
  );
}

/**
 * Aplica as operações de imagem (create/replace/delete/keep).
 * Registra em `files` os arquivos criados e os que devem ser removidos
 * após o commit, para manter disco e banco consistentes.
 */
async function applyImageOperations(productId, operations, transaction, files) {
  const existing = await ProductImage.findAll({ where: { product_id: productId }, transaction });
  const byId = new Map(existing.map((image) => [image.id, image]));

  for (const op of operations) {
    const image = op.id ? byId.get(op.id) : null;
    if (op.id && !image) throw AppError.badRequest(`A imagem ${op.id} não pertence a este produto`);

    if (op.action === 'delete') {
      await image.destroy({ transaction });
      files.toRemove.push(image.path);
    } else if (op.action === 'replace') {
      // Sem type, mantém a extensão atual do arquivo
      const type = op.type || `image/${image.path.split('.').pop()}`;
      const newPath = await imageStorage.save(productId, op.buffer, type);
      files.created.push(newPath);
      files.toRemove.push(image.path);
      await image.update({ path: newPath }, { transaction });
    } else if (op.action === 'create') {
      const newPath = await imageStorage.save(productId, op.buffer, op.type);
      files.created.push(newPath);
      await ProductImage.create({ product_id: productId, path: newPath, enabled: true }, { transaction });
    }
    // action "keep": nada a fazer
  }
}

/** Aplica as operações de opção (create/update/delete). */
async function applyOptionOperations(productId, operations, transaction) {
  const existing = await ProductOption.findAll({ where: { product_id: productId }, transaction });
  const byId = new Map(existing.map((option) => [option.id, option]));

  for (const op of operations) {
    const option = op.id ? byId.get(op.id) : null;
    if (op.id && !option) throw AppError.badRequest(`A opção ${op.id} não pertence a este produto`);

    if (op.action === 'delete') {
      await option.destroy({ transaction });
    } else if (op.action === 'update') {
      await option.update(op.data, { transaction });
    } else if (op.action === 'create') {
      await ProductOption.create({ ...op.data, product_id: productId }, { transaction });
    }
  }
}

/**
 * Executa uma escrita em transação cuidando dos arquivos de imagem:
 * em caso de erro remove os arquivos novos; em caso de sucesso remove os antigos.
 */
async function withTransactionAndFiles(work) {
  const files = { created: [], toRemove: [] };

  try {
    const result = await sequelize.transaction((transaction) => work(transaction, files));
    await Promise.all(files.toRemove.map(imageStorage.remove));
    return result;
  } catch (error) {
    await Promise.all(files.created.map(imageStorage.remove));
    throw error;
  }
}

/** Cria um produto com categorias, imagens e opções. */
async function create({ product: data, categoryIds, images, options }) {
  await ensureSlugIsAvailable(data.slug);
  await ensureCategoriesExist(categoryIds);

  const id = await withTransactionAndFiles(async (transaction, files) => {
    const product = await Product.create(data, { transaction });

    if (categoryIds) await syncCategories(product.id, categoryIds, transaction);
    if (images) await applyImageOperations(product.id, images, transaction, files);
    if (options) await applyOptionOperations(product.id, options, transaction);

    return product.id;
  });

  return findById(id);
}

/** Atualiza um produto e, se informados, suas categorias, imagens e opções. */
async function update(id, { product: data, categoryIds, images, options }) {
  const product = await Product.findByPk(id);
  if (!product) throw AppError.notFound('Produto não encontrado');

  if (data.slug) await ensureSlugIsAvailable(data.slug, id);
  await ensureCategoriesExist(categoryIds);

  await withTransactionAndFiles(async (transaction, files) => {
    if (Object.keys(data).length > 0) await product.update(data, { transaction });
    if (categoryIds) await syncCategories(id, categoryIds, transaction);
    if (images) await applyImageOperations(id, images, transaction, files);
    if (options) await applyOptionOperations(id, options, transaction);
  });
}

/** Remove o produto (relações via ON DELETE CASCADE) e a pasta de imagens. */
async function remove(id) {
  const product = await Product.findByPk(id, { attributes: ['id'] });
  if (!product) throw AppError.notFound('Produto não encontrado');

  await product.destroy();
  await imageStorage.removeProductDir(id);
}

module.exports = { search, findById, create, update, remove };
