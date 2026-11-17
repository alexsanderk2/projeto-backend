/**
 * Armazenamento das imagens dos produtos no disco do servidor.
 * Os arquivos ficam em public/media/products/<productId>/ e o banco
 * guarda apenas o caminho relativo (ex.: media/products/1/abc.png).
 */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const env = require('../config/env');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');

// Tipos MIME aceitos e a extensão de arquivo correspondente.
// Object.freeze + isSupportedType (Object.hasOwn) evitam aceitar chaves
// herdadas do prototype, como "constructor" ou "__proto__".
const MIME_EXTENSIONS = Object.freeze({
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
});

const isSupportedType = (mimeType) => typeof mimeType === 'string' && Object.hasOwn(MIME_EXTENSIONS, mimeType);

/**
 * Identifica o formato real da imagem pelos primeiros bytes (magic bytes).
 * @returns {string|null} extensão (png, jpg, gif, webp) ou null se não for uma imagem suportada
 */
function detectExtension(buffer) {
  const startsWith = (bytes, offset = 0) => bytes.every((byte, i) => buffer[offset + i] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith([0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith([0x47, 0x49, 0x46, 0x38])) return 'gif'; // "GIF8"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return 'webp'; // RIFF....WEBP
  return null;
}

/** Salva uma imagem (Buffer) com a extensão informada e devolve o caminho relativo. */
async function save(productId, buffer, extension) {
  const relativeDir = path.posix.join('media', 'products', String(productId));
  const fileName = `${crypto.randomUUID()}.${extension}`;

  await fs.mkdir(path.join(PUBLIC_DIR, relativeDir), { recursive: true });
  await fs.writeFile(path.join(PUBLIC_DIR, relativeDir, fileName), buffer);

  return path.posix.join(relativeDir, fileName);
}

/** Remove um arquivo a partir do caminho relativo (ignora se não existir). */
async function remove(relativePath) {
  if (!relativePath) return;
  await fs.rm(path.join(PUBLIC_DIR, relativePath), { force: true });
}

/** Remove a pasta de imagens de um produto. */
async function removeProductDir(productId) {
  await fs.rm(path.join(PUBLIC_DIR, 'media', 'products', String(productId)), { recursive: true, force: true });
}

/** Monta a URL pública de uma imagem a partir do caminho relativo. */
function toUrl(relativePath) {
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${env.appUrl.replace(/\/$/, '')}/${relativePath}`;
}

module.exports = {
  save, remove, removeProductDir, toUrl, detectExtension, isSupportedType, MIME_EXTENSIONS,
};
