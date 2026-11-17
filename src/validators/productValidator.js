/**
 * Validação dos payloads de produto (criação e atualização).
 * Além de validar, normaliza os dados para o formato esperado pelo service:
 * - imagens base64 viram Buffer
 * - radius "4px" vira 4
 * - values/value viram um array de strings
 */
const {
  isPresent, isNonEmptyString, isBoolean, isNumber, isInteger, isSlug, isPlainObject,
  assertValid, assertBody,
} = require('../utils/validation');
const { MIME_EXTENSIONS } = require('../services/imageStorage');

const SHAPES = ['square', 'circle'];
const OPTION_TYPES = ['text', 'color'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB por imagem
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;
const URL_REGEX = /^https?:\/\//i;

/* -------------------------------------------------------------------------- */
/*                               Campos simples                               */
/* -------------------------------------------------------------------------- */

function validateBaseFields(body, errors, partial) {
  const data = {};
  const required = (field) => !partial || isPresent(body[field]);

  if (required('name')) {
    if (isNonEmptyString(body.name)) data.name = body.name.trim();
    else errors.push({ field: 'name', message: 'name é obrigatório' });
  }

  if (required('slug')) {
    if (isSlug(body.slug)) data.slug = body.slug;
    else errors.push({ field: 'slug', message: 'slug é obrigatório e deve conter apenas letras minúsculas, números e hífens' });
  }

  if (required('price')) {
    if (isNumber(body.price) && body.price >= 0) data.price = body.price;
    else errors.push({ field: 'price', message: 'price é obrigatório e deve ser um número maior ou igual a zero' });
  }

  if (required('price_with_discount')) {
    if (isNumber(body.price_with_discount) && body.price_with_discount >= 0) {
      data.price_with_discount = body.price_with_discount;
    } else {
      errors.push({ field: 'price_with_discount', message: 'price_with_discount é obrigatório e deve ser um número maior ou igual a zero' });
    }
  }

  ['enabled', 'use_in_menu'].forEach((field) => {
    if (!isPresent(body[field])) return;
    if (isBoolean(body[field])) data[field] = body[field];
    else errors.push({ field, message: `${field} deve ser booleano` });
  });

  if (isPresent(body.stock)) {
    if (isInteger(body.stock) && body.stock >= 0) data.stock = body.stock;
    else errors.push({ field: 'stock', message: 'stock deve ser um inteiro maior ou igual a zero' });
  }

  if (body.description !== undefined) {
    if (body.description === null || typeof body.description === 'string') data.description = body.description;
    else errors.push({ field: 'description', message: 'description deve ser texto' });
  }

  return data;
}

function validateCategoryIds(value, errors) {
  if (value === undefined) return undefined;

  if (!Array.isArray(value) || !value.every((id) => isInteger(id) && id > 0)) {
    errors.push({ field: 'category_ids', message: 'category_ids deve ser um array de inteiros positivos' });
    return undefined;
  }

  return [...new Set(value)];
}

/* -------------------------------------------------------------------------- */
/*                                   Imagens                                  */
/* -------------------------------------------------------------------------- */

/** Converte uma string base64 (com ou sem prefixo data:) em Buffer. */
function decodeBase64(content) {
  if (typeof content !== 'string') return null;

  const raw = content.replace(/^data:[\w/+.-]+;base64,/, '').replace(/\s/g, '');
  if (!raw || !BASE64_REGEX.test(raw)) return null;

  return Buffer.from(raw, 'base64');
}

/** Valida tipo + conteúdo base64 de uma imagem nova. */
function parseImageContent(image, field, errors, { typeRequired = true } = {}) {
  if ((typeRequired || isPresent(image.type)) && !MIME_EXTENSIONS[image.type]) {
    errors.push({ field: `${field}.type`, message: `type deve ser um destes: ${Object.keys(MIME_EXTENSIONS).join(', ')}` });
    return null;
  }

  const buffer = decodeBase64(image.content);
  if (!buffer) {
    errors.push({ field: `${field}.content`, message: 'content deve ser uma imagem em base64' });
    return null;
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    errors.push({ field: `${field}.content`, message: 'A imagem deve ter no máximo 5 MB' });
    return null;
  }

  return { type: image.type, buffer };
}

/**
 * Valida a lista de imagens.
 * Na criação, toda imagem é nova ({ type, content }).
 * Na atualização, cada item pode:
 *  - { type, content }        -> adicionar nova imagem
 *  - { id, deleted: true }    -> remover imagem
 *  - { id, content: base64 }  -> substituir o arquivo da imagem
 *  - { id, content: url }     -> manter a imagem como está
 */
function validateImages(value, errors, partial) {
  if (value === undefined) return undefined;

  if (!Array.isArray(value)) {
    errors.push({ field: 'images', message: 'images deve ser um array' });
    return undefined;
  }

  const operations = [];

  value.forEach((image, index) => {
    const field = `images[${index}]`;

    if (!isPlainObject(image)) {
      errors.push({ field, message: 'Cada imagem deve ser um objeto' });
      return;
    }

    if (!partial || !isPresent(image.id)) {
      const parsed = parseImageContent(image, field, errors);
      if (parsed) operations.push({ action: 'create', ...parsed });
      return;
    }

    if (!isInteger(image.id) || image.id <= 0) {
      errors.push({ field: `${field}.id`, message: 'id deve ser um inteiro positivo' });
      return;
    }

    if (image.deleted === true) {
      operations.push({ action: 'delete', id: image.id });
    } else if (typeof image.content === 'string' && URL_REGEX.test(image.content)) {
      operations.push({ action: 'keep', id: image.id });
    } else {
      const parsed = parseImageContent(image, field, errors, { typeRequired: false });
      if (parsed) operations.push({ action: 'replace', id: image.id, ...parsed });
    }
  });

  return operations;
}

/* -------------------------------------------------------------------------- */
/*                                   Opções                                   */
/* -------------------------------------------------------------------------- */

/** Aceita radius como número (4) ou string ("4px"). */
function parseRadius(value) {
  if (isInteger(value) && value >= 0) return value;
  const match = typeof value === 'string' && value.trim().match(/^(\d+)(px)?$/);
  return match ? Number(match[1]) : null;
}

/** Aceita values (ou value) como array de strings ou string separada por vírgulas. */
function parseValues(value) {
  const list = typeof value === 'string' ? value.split(',') : value;
  if (!Array.isArray(list)) return null;

  const items = list.map((item) => (typeof item === 'number' ? String(item) : item));
  if (items.length === 0 || !items.every((item) => isNonEmptyString(item) && !item.includes(','))) {
    return null;
  }

  return items.map((item) => item.trim());
}

/** Valida os campos de uma opção. Quando isNew=true, title e values são obrigatórios. */
function parseOptionFields(option, field, errors, isNew) {
  const data = {};
  const rawValues = option.values !== undefined ? option.values : option.value;

  if (isNew || isPresent(option.title)) {
    if (isNonEmptyString(option.title)) data.title = option.title.trim();
    else errors.push({ field: `${field}.title`, message: 'title é obrigatório' });
  }

  if (isNew || isPresent(rawValues)) {
    const values = parseValues(rawValues);
    if (values && values.join(',').length <= 255) data.values = values;
    else errors.push({ field: `${field}.values`, message: 'values deve ser um array de textos não vazio (sem vírgulas, até 255 caracteres no total)' });
  }

  if (isPresent(option.shape)) {
    if (SHAPES.includes(option.shape)) data.shape = option.shape;
    else errors.push({ field: `${field}.shape`, message: `shape deve ser: ${SHAPES.join(' ou ')}` });
  }

  if (isPresent(option.type)) {
    if (OPTION_TYPES.includes(option.type)) data.type = option.type;
    else errors.push({ field: `${field}.type`, message: `type deve ser: ${OPTION_TYPES.join(' ou ')}` });
  }

  if (isPresent(option.radius)) {
    const radius = parseRadius(option.radius);
    if (radius !== null) data.radius = radius;
    else errors.push({ field: `${field}.radius`, message: 'radius deve ser um inteiro (ex.: 4 ou "4px")' });
  }

  return data;
}

/**
 * Valida a lista de opções.
 * Na atualização, cada item pode:
 *  - sem id                 -> criar opção
 *  - { id, deleted: true }  -> remover opção
 *  - { id, ...campos }      -> atualizar campos informados
 */
function validateOptions(value, errors, partial) {
  if (value === undefined) return undefined;

  if (!Array.isArray(value)) {
    errors.push({ field: 'options', message: 'options deve ser um array' });
    return undefined;
  }

  const operations = [];

  value.forEach((option, index) => {
    const field = `options[${index}]`;

    if (!isPlainObject(option)) {
      errors.push({ field, message: 'Cada opção deve ser um objeto' });
      return;
    }

    if (!partial || !isPresent(option.id)) {
      operations.push({ action: 'create', data: parseOptionFields(option, field, errors, true) });
      return;
    }

    if (!isInteger(option.id) || option.id <= 0) {
      errors.push({ field: `${field}.id`, message: 'id deve ser um inteiro positivo' });
      return;
    }

    if (option.deleted === true) {
      operations.push({ action: 'delete', id: option.id });
    } else {
      operations.push({ action: 'update', id: option.id, data: parseOptionFields(option, field, errors, false) });
    }
  });

  return operations;
}

/* -------------------------------------------------------------------------- */
/*                                   Público                                  */
/* -------------------------------------------------------------------------- */

function validate(body, { partial = false } = {}) {
  assertBody(body);
  const errors = [];

  const product = validateBaseFields(body, errors, partial);
  const categoryIds = validateCategoryIds(body.category_ids, errors);
  const images = validateImages(body.images, errors, partial);
  const options = validateOptions(body.options, errors, partial);

  const hasChanges = Object.keys(product).length > 0
    || categoryIds !== undefined || images !== undefined || options !== undefined;

  if (partial && errors.length === 0 && !hasChanges) {
    errors.push({ field: 'body', message: 'Informe ao menos um campo para atualizar' });
  }

  assertValid(errors);
  return { product, categoryIds, images, options };
}

module.exports = {
  validateCreate: (body) => validate(body),
  validateUpdate: (body) => validate(body, { partial: true }),
};
