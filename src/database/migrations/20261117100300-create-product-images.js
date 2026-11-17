'use strict';

/** Cria a tabela de imagens do produto (relação 1:N com products). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        // Ao excluir o produto, suas imagens são removidas junto
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      // Caminho relativo do arquivo salvo no servidor (ex.: media/products/abc.png)
      path: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.addIndex('product_images', ['product_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
