/**
 * Interpreta e valida as query strings de GET /v1/product/search.
 */
const AppError = require('../utils/AppError');
const { parsePagination, parseFields } = require('../utils/queryParams');

const PRODUCT_FIELDS = [
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'category_ids', 'images', 'options',
];

/** category_ids=15,24 -> [15, 24] */
function parseCategoryIds(value) {
  if (value === undefined || value === '') return undefined;

  const ids = String(value).split(',').map((id) => Number(id.trim()));
  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw AppError.badRequest('category_ids deve conter inteiros positivos separados por vírgula');
  }

  return [...new Set(ids)];
}

/** price-range=100-200 -> { min: 100, max: 200 } */
function parsePriceRange(value) {
  if (value === undefined || value === '') return undefined;

  const match = String(value).match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  const min = match && Number(match[1]);
  const max = match && Number(match[2]);

  if (!match || min > max) {
    throw AppError.badRequest('price-range deve estar no formato min-max (ex.: 100-200)');
  }

  return { min, max };
}

/**
 * option[45]=GG,PP -> [{ key: 45, values: ['GG', 'PP'] }]
 * A chave pode ser o ID da opção ou o seu título (ex.: option[Tamanho]=P,M).
 * As chaves são lidas diretamente do objeto de query, funcionando com
 * o parser "simple" do Express 5 (que não monta objetos aninhados).
 */
function parseOptions(query) {
  const filters = [];

  Object.entries(query).forEach(([key, value]) => {
    const match = key.match(/^option\[(.+)\]$/);
    if (!match) return;

    const values = [].concat(value).join(',').split(',').map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) {
      throw AppError.badRequest(`${key} deve conter ao menos um valor`);
    }

    const optionKey = /^\d+$/.test(match[1]) ? Number(match[1]) : match[1];
    filters.push({ key: optionKey, values });
  });

  return filters;
}

function parseSearchQuery(query) {
  const match = typeof query.match === 'string' && query.match.trim() ? query.match.trim() : undefined;

  return {
    pagination: parsePagination(query),
    fields: parseFields(query.fields, PRODUCT_FIELDS),
    match,
    categoryIds: parseCategoryIds(query.category_ids),
    priceRange: parsePriceRange(query['price-range']),
    options: parseOptions(query),
  };
}

module.exports = { parseSearchQuery, PRODUCT_FIELDS };
