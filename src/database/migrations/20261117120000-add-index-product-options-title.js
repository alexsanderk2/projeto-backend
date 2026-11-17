'use strict';

/**
 * Adiciona índice (title, product_id) em product_options para acelerar
 * o filtro option[<título>]=... da busca de produtos.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('product_options', ['title', 'product_id'], {
      name: 'product_options_title_product_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('product_options', 'product_options_title_product_id');
  },
};
