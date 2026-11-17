const { Model, DataTypes } = require('sequelize');

/** Model de categoria de produtos. */
class Category extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
        use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      },
      { sequelize, modelName: 'Category', tableName: 'categories' },
    );
  }

  static associate(models) {
    this.belongsToMany(models.Product, {
      through: models.ProductCategory,
      foreignKey: 'category_id',
      otherKey: 'product_id',
      as: 'products',
    });
  }
}

module.exports = Category;
