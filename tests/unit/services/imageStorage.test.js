const fs = require('fs');
const path = require('path');

const imageStorage = require('../../../src/services/imageStorage');
const env = require('../../../src/config/env');
const {
  PNG_BASE64, JPG_BASE64, GIF_BASE64, WEBP_BASE64, TEXT_BASE64,
} = require('../../helpers/fixtures');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', '..', 'public');
const TEST_PRODUCT_ID = 'unit-test';

describe('imageStorage', () => {
  describe('detectExtension', () => {
    it.each([
      [PNG_BASE64, 'png'],
      [JPG_BASE64, 'jpg'],
      [GIF_BASE64, 'gif'],
      [WEBP_BASE64, 'webp'],
      [TEXT_BASE64, null],
    ])('identifica o formato pelos magic bytes (%#)', (base64, expected) => {
      expect(imageStorage.detectExtension(Buffer.from(base64, 'base64'))).toBe(expected);
    });

    it('retorna null para buffer vazio', () => {
      expect(imageStorage.detectExtension(Buffer.alloc(0))).toBeNull();
    });
  });

  describe('isSupportedType', () => {
    it.each([['image/png'], ['image/jpg'], ['image/jpeg'], ['image/webp'], ['image/gif']])('aceita %s', (type) => {
      expect(imageStorage.isSupportedType(type)).toBe(true);
    });

    it.each([['image/svg+xml'], ['constructor'], ['__proto__'], ['toString'], [undefined], [123]])('rejeita %p', (type) => {
      expect(imageStorage.isSupportedType(type)).toBe(false);
    });
  });

  describe('toUrl', () => {
    it('monta a URL pública a partir do caminho relativo', () => {
      expect(imageStorage.toUrl('media/products/1/a.png')).toBe(`${env.appUrl}/media/products/1/a.png`);
    });

    it('mantém URLs absolutas como estão', () => {
      expect(imageStorage.toUrl('https://cdn.com/a.png')).toBe('https://cdn.com/a.png');
    });
  });

  describe('save / remove', () => {
    afterAll(() => imageStorage.removeProductDir(TEST_PRODUCT_ID));

    it('grava o arquivo com nome único e remove depois', async () => {
      const buffer = Buffer.from(PNG_BASE64, 'base64');

      const first = await imageStorage.save(TEST_PRODUCT_ID, buffer, 'png');
      const second = await imageStorage.save(TEST_PRODUCT_ID, buffer, 'png');

      expect(first).toMatch(new RegExp(`^media/products/${TEST_PRODUCT_ID}/[0-9a-f-]{36}\\.png$`));
      expect(first).not.toBe(second);
      expect(fs.readFileSync(path.join(PUBLIC_DIR, first))).toEqual(buffer);

      await imageStorage.remove(first);
      expect(fs.existsSync(path.join(PUBLIC_DIR, first))).toBe(false);
    });

    it('remove() não falha se o arquivo não existir', async () => {
      await expect(imageStorage.remove('media/products/nao-existe.png')).resolves.toBeUndefined();
      await expect(imageStorage.remove(null)).resolves.toBeUndefined();
    });
  });
});
