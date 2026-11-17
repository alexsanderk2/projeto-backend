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

// Tipos MIME aceitos e a extensão de arquivo correspondente
const MIME_EXTENSIONS = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Salva uma imagem (Buffer) e devolve o caminho relativo. */
async function save(productId, buffer, mimeType) {
  const extension = MIME_EXTENSIONS[mimeType];
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

module.exports = { save, remove, removeProductDir, toUrl, MIME_EXTENSIONS };
