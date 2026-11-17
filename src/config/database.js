/**
 * Configuração de conexão com o MySQL.
 * Este arquivo é usado tanto pela aplicação quanto pelo sequelize-cli
 * (migrations e seeders), por isso exporta um objeto por ambiente.
 */
require('dotenv').config({ quiet: true });

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'digital_store',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  define: {
    // Gera created_at / updated_at e nomes de colunas em snake_case
    timestamps: true,
    underscored: true,
  },
};

module.exports = {
  development: base,
  test: { ...base, database: process.env.DB_NAME_TEST || `${base.database}_test` },
  production: base,
};
