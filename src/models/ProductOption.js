const { Model, DataTypes } = require('sequelize');

/** Model de opção do produto (ex.: tamanho, cor). */
class ProductOption extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
        radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
        // No banco é uma string "a,b,c"; na API trafega como array
        values: {
          type: DataTypes.STRING,
          allowNull: false,
          get() {
            const raw = this.getDataValue('values');
            return raw ? raw.split(',') : [];
          },
          set(value) {
            this.setDataValue('values', Array.isArray(value) ? value.join(',') : value);
          },
        },
      },
      { sequelize, modelName: 'ProductOption', tableName: 'product_options', timestamps: false },
    );
  }

  static associate(models) {
    this.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductOption;
