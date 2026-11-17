const { Model, DataTypes } = require('sequelize');

/** Model de produto. */
class Product extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        name: { type: DataTypes.STRING, allowNull: false },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
        use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        description: { type: DataTypes.STRING, allowNull: true },
        price: { type: DataTypes.FLOAT, allowNull: false },
        price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
      },
      { sequelize, modelName: 'Product', tableName: 'products' },
    );
  }

  static associate(models) {
    this.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
    this.hasMany(models.ProductOption, { foreignKey: 'product_id', as: 'options' });
    this.belongsToMany(models.Category, {
      through: models.ProductCategory,
      foreignKey: 'product_id',
      otherKey: 'category_id',
      as: 'categories',
    });
  }
}

module.exports = Product;
