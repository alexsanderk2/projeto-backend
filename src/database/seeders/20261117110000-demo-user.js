'use strict';

const bcrypt = require('bcrypt');

/** Usuário de demonstração para gerar o token JWT (senha: 123@123). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        firstname: 'Admin',
        surname: 'Digital Store',
        email: 'admin@digitalstore.com',
        password: await bcrypt.hash('123@123', 10),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@digitalstore.com' });
  },
};
