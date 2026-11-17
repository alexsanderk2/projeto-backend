/**
 * Inicializa a conexão do Sequelize, registra os models
 * e configura as associações entre eles.
 */
const { Sequelize } = require('sequelize');
const env = require('../config/env');
const dbConfig = require('../config/database')[env.nodeEnv];

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const models = { User, Category, Product, ProductImage, ProductOption, ProductCategory };

Object.values(models).forEach((model) => model.initModel(sequelize));
Object.values(models).forEach((model) => model.associate && model.associate(models));

module.exports = { sequelize, Sequelize, ...models };
