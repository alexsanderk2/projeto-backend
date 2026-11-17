'use strict';

/** Cria a tabela de categorias. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      // Slug único: usado em URLs amigáveis e buscas diretas
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Índice para o filtro use_in_menu=true da listagem
    await queryInterface.addIndex('categories', ['use_in_menu']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
