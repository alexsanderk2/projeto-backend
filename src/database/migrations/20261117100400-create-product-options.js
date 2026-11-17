'use strict';

/** Cria a tabela de opções do produto (relação 1:N com products). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_options', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      shape: { type: Sequelize.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
      radius: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      type: { type: Sequelize.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
      // Valores separados por vírgula (ex.: "P,M,G")
      values: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.addIndex('product_options', ['product_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_options');
  },
};
