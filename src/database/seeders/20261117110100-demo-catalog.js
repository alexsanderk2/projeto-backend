'use strict';

/**
 * Catálogo de demonstração: categorias, produtos, opções e vínculos.
 * Os IDs são fixos para facilitar os testes manuais pela documentação.
 */
const now = new Date();

const categories = [
  { id: 1, name: 'Tênis', slug: 'tenis', use_in_menu: true },
  { id: 2, name: 'Camisetas', slug: 'camisetas', use_in_menu: true },
  { id: 3, name: 'Calças', slug: 'calcas', use_in_menu: true },
  { id: 4, name: 'Black Friday', slug: 'black-friday', use_in_menu: false },
];

const products = [
  {
    id: 1, enabled: true, name: 'Tênis K-Swiss V8', slug: 'tenis-k-swiss-v8', stock: 15,
    description: 'Tênis masculino confortável para o dia a dia', price: 219.9, price_with_discount: 179.9,
  },
  {
    id: 2, enabled: true, name: 'Tênis Runner Pro', slug: 'tenis-runner-pro', stock: 8,
    description: 'Tênis de corrida leve com amortecimento', price: 349.9, price_with_discount: 299.9,
  },
  {
    id: 3, enabled: true, name: 'Camiseta Básica', slug: 'camiseta-basica', stock: 40,
    description: 'Camiseta 100% algodão', price: 59.9, price_with_discount: 49.9,
  },
  {
    id: 4, enabled: false, name: 'Calça Jeans Slim', slug: 'calca-jeans-slim', stock: 0,
    description: 'Calça jeans com elastano', price: 159.9, price_with_discount: 159.9,
  },
];

const options = [
  { product_id: 1, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: '39,40,41,42,43' },
  { product_id: 1, title: 'Cor', shape: 'circle', radius: 0, type: 'color', values: '#000000,#FFFFFF' },
  { product_id: 2, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: '38,39,40,41' },
  { product_id: 3, title: 'Tamanho', shape: 'square', radius: 0, type: 'text', values: 'P,M,G,GG' },
  { product_id: 3, title: 'Cor', shape: 'circle', radius: 0, type: 'color', values: '#000000,#1E3A8A,#DC2626' },
  { product_id: 4, title: 'Tamanho', shape: 'square', radius: 0, type: 'text', values: '38,40,42,44' },
];

const productCategories = [
  { product_id: 1, category_id: 1 },
  { product_id: 1, category_id: 4 },
  { product_id: 2, category_id: 1 },
  { product_id: 3, category_id: 2 },
  { product_id: 3, category_id: 4 },
  { product_id: 4, category_id: 3 },
];

module.exports = {
  async up(queryInterface) {
    const withTimestamps = (rows) => rows.map((row) => ({ ...row, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('categories', withTimestamps(categories));
    await queryInterface.bulkInsert('products', withTimestamps(products));
    await queryInterface.bulkInsert('product_options', options);
    await queryInterface.bulkInsert('product_categories', productCategories);
  },

  async down(queryInterface) {
    // ON DELETE CASCADE remove opções e vínculos junto com os produtos
    await queryInterface.bulkDelete('products', { id: products.map((p) => p.id) });
    await queryInterface.bulkDelete('categories', { id: categories.map((c) => c.id) });
  },
};
