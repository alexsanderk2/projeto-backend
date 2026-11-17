const { Model, DataTypes } = require('sequelize');

/** Model de imagem do produto. O campo path guarda o caminho relativo do arquivo. */
class ProductImage extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        path: { type: DataTypes.STRING, allowNull: false },
      },
      { sequelize, modelName: 'ProductImage', tableName: 'product_images', timestamps: false },
    );
  }

  static associate(models) {
    this.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductImage;
