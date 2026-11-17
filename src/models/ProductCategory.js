const { Model, DataTypes } = require('sequelize');

/** Tabela associativa entre produtos e categorias (N:N). */
class ProductCategory extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        product_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
        category_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
      },
      { sequelize, modelName: 'ProductCategory', tableName: 'product_categories', timestamps: false },
    );
  }
}

module.exports = ProductCategory;
