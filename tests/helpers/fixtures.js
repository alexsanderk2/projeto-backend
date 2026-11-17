/**
 * Dados reutilizados nos testes.
 */

// PNG 1x1 válido
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Apenas a assinatura (magic bytes) de cada formato, suficiente para a detecção
const JPG_BASE64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString('base64');
const GIF_BASE64 = Buffer.from('GIF89a').toString('base64');
const WEBP_BASE64 = Buffer.concat([
  Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP'),
]).toString('base64');
const TEXT_BASE64 = Buffer.from('não sou uma imagem').toString('base64');

const validUser = (overrides = {}) => ({
  firstname: 'Ana',
  surname: 'Silva',
  email: 'ana@mail.com',
  password: '123@123',
  confirmPassword: '123@123',
  ...overrides,
});

const validProduct = (overrides = {}) => ({
  enabled: true,
  name: 'Tênis Runner',
  slug: 'tenis-runner',
  stock: 10,
  description: 'Tênis de corrida leve',
  price: 119.9,
  price_with_discount: 99.9,
  ...overrides,
});

module.exports = {
  PNG_BASE64, JPG_BASE64, GIF_BASE64, WEBP_BASE64, TEXT_BASE64, validUser, validProduct,
};
