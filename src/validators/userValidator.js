const {
  isPresent, isNonEmptyString, isEmail, assertValid, assertBody,
} = require('../utils/validation');

const MIN_PASSWORD_LENGTH = 6;

/** Valida o payload de cadastro de usuário (POST /v1/user). */
function validateCreate(body) {
  assertBody(body);
  const errors = [];
  const { firstname, surname, email, password, confirmPassword } = body;

  if (!isNonEmptyString(firstname)) errors.push({ field: 'firstname', message: 'firstname é obrigatório' });
  if (!isNonEmptyString(surname)) errors.push({ field: 'surname', message: 'surname é obrigatório' });
  if (!isEmail(email)) errors.push({ field: 'email', message: 'email inválido' });

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    errors.push({ field: 'password', message: `password deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres` });
  } else if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'confirmPassword deve ser igual a password' });
  }

  assertValid(errors);

  return {
    firstname: firstname.trim(),
    surname: surname.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
}

/** Valida o payload de atualização de usuário (PUT /v1/user/:id). */
function validateUpdate(body) {
  assertBody(body);
  const errors = [];
  const data = {};
  const { firstname, surname, email } = body;

  if (isPresent(firstname)) {
    if (isNonEmptyString(firstname)) data.firstname = firstname.trim();
    else errors.push({ field: 'firstname', message: 'firstname não pode ser vazio' });
  }

  if (isPresent(surname)) {
    if (isNonEmptyString(surname)) data.surname = surname.trim();
    else errors.push({ field: 'surname', message: 'surname não pode ser vazio' });
  }

  if (isPresent(email)) {
    if (isEmail(email)) data.email = email.trim().toLowerCase();
    else errors.push({ field: 'email', message: 'email inválido' });
  }

  if (errors.length === 0 && Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'Informe ao menos um campo: firstname, surname ou email' });
  }

  assertValid(errors);
  return data;
}

/** Valida o payload de geração de token (POST /v1/user/token). */
function validateToken(body) {
  assertBody(body);
  const errors = [];
  const { email, password } = body;

  if (!isEmail(email)) errors.push({ field: 'email', message: 'email inválido' });
  if (!isNonEmptyString(password)) errors.push({ field: 'password', message: 'password é obrigatório' });

  assertValid(errors);
  return { email: email.trim().toLowerCase(), password };
}

module.exports = { validateCreate, validateUpdate, validateToken };
