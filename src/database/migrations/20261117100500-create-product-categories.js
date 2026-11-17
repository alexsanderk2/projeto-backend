'use strict';

/** Cria a tabela associativa produtos x categorias (relação N:N). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'categories', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    });

    // A PK composta (product_id, category_id) já indexa por produto;
    // este índice acelera o filtro de produtos por categoria.
    await queryInterface.addIndex('product_categories', ['category_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_categories');
  },
};
