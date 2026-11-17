/**
 * Helpers simples de validação usados pelos validators de cada recurso.
 * Cada validator acumula os erros encontrados e, no final, chama
 * assertValid() para lançar um único 400 com todos os detalhes.
 */
const AppError = require('./AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Tamanho das colunas STRING (VARCHAR(255)) no banco
const MAX_STRING_LENGTH = 255;

const isPresent = (value) => value !== undefined && value !== null;
const isNonEmptyString = (value, max = MAX_STRING_LENGTH) => (
  typeof value === 'string' && value.trim().length > 0 && value.length <= max
);
const isBoolean = (value) => typeof value === 'boolean';
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isInteger = (value) => Number.isInteger(value);
const isEmail = (value) => typeof value === 'string' && value.length <= MAX_STRING_LENGTH && EMAIL_REGEX.test(value);
const isSlug = (value) => typeof value === 'string' && value.length <= MAX_STRING_LENGTH && SLUG_REGEX.test(value);
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Lança 400 caso existam erros acumulados. */
function assertValid(errors) {
  if (errors.length > 0) {
    throw AppError.badRequest('Dados inválidos', errors);
  }
}

/** Garante que o corpo da requisição seja um objeto JSON. */
function assertBody(body) {
  if (!isPlainObject(body)) {
    throw AppError.badRequest('O corpo da requisição deve ser um objeto JSON');
  }
}

/** Converte o parâmetro :id da rota em inteiro positivo ou lança 400. */
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('O parâmetro id deve ser um número inteiro positivo');
  }
  return id;
}

module.exports = {
  MAX_STRING_LENGTH,
  isPresent,
  isNonEmptyString,
  isBoolean,
  isNumber,
  isInteger,
  isEmail,
  isSlug,
  isPlainObject,
  assertValid,
  assertBody,
  parseId,
};
