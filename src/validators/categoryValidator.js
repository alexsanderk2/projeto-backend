const {
  isPresent, isNonEmptyString, isBoolean, isSlug, assertValid, assertBody,
} = require('../utils/validation');

/**
 * Valida o payload de categoria.
 * @param {object} body corpo da requisição
 * @param {{ partial?: boolean }} options partial=true para atualização (campos opcionais)
 */
function validate(body, { partial = false } = {}) {
  assertBody(body);
  const errors = [];
  const data = {};
  const { name, slug, use_in_menu: useInMenu } = body;

  if (isPresent(name) || !partial) {
    if (isNonEmptyString(name)) data.name = name.trim();
    else errors.push({ field: 'name', message: 'name é obrigatório' });
  }

  if (isPresent(slug) || !partial) {
    if (isSlug(slug)) data.slug = slug;
    else errors.push({ field: 'slug', message: 'slug é obrigatório e deve conter apenas letras minúsculas, números e hífens' });
  }

  if (isPresent(useInMenu)) {
    if (isBoolean(useInMenu)) data.use_in_menu = useInMenu;
    else errors.push({ field: 'use_in_menu', message: 'use_in_menu deve ser booleano' });
  }

  if (partial && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'Informe ao menos um campo: name, slug ou use_in_menu' });
  }

  assertValid(errors);
  return data;
}

module.exports = {
  validateCreate: (body) => validate(body),
  validateUpdate: (body) => validate(body, { partial: true }),
};
