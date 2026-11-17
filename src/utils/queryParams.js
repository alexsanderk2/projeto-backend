/**
 * Helpers para interpretar query strings comuns às buscas
 * (paginação, seleção de campos e booleanos).
 */
const AppError = require('./AppError');

const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

/**
 * Lê limit e page. limit=-1 retorna todos os itens (page é ignorado).
 * @returns {{ limit: number, page: number, offset: number|undefined, sqlLimit: number|undefined }}
 */
function parsePagination(query) {
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  const page = query.page === undefined ? DEFAULT_PAGE : Number(query.page);

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1)) {
    throw AppError.badRequest('limit deve ser um inteiro maior que zero ou -1');
  }

  if (!Number.isInteger(page) || page < 1) {
    throw AppError.badRequest('page deve ser um inteiro maior que zero');
  }

  if (limit === -1) {
    return { limit, page: DEFAULT_PAGE, sqlLimit: undefined, offset: undefined };
  }

  return { limit, page, sqlLimit: limit, offset: (page - 1) * limit };
}

/**
 * Lê fields=campo1,campo2 e valida contra a lista de campos permitidos.
 * @returns {string[]|null} lista de campos ou null quando não informado
 */
function parseFields(value, allowed) {
  if (value === undefined || value === '') return null;

  const fields = String(value).split(',').map((f) => f.trim()).filter(Boolean);
  const invalid = fields.filter((f) => !allowed.includes(f));

  if (invalid.length > 0) {
    throw AppError.badRequest(`Campos inválidos em fields: ${invalid.join(', ')}. Permitidos: ${allowed.join(', ')}`);
  }

  return fields;
}

/** Converte "true"/"false"/"1"/"0" em boolean, ou lança 400. */
function parseBoolean(value, name) {
  if (value === undefined) return undefined;
  if (['true', '1'].includes(String(value))) return true;
  if (['false', '0'].includes(String(value))) return false;
  throw AppError.badRequest(`${name} deve ser true ou false`);
}

module.exports = { parsePagination, parseFields, parseBoolean, DEFAULT_LIMIT };
