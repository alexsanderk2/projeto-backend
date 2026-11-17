const { Model, DataTypes } = require('sequelize');

/** Model de usuário. A senha é sempre armazenada como hash bcrypt. */
class User extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        firstname: { type: DataTypes.STRING, allowNull: false },
        surname: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        // Nunca devolve o hash da senha por padrão
        defaultScope: { attributes: { exclude: ['password'] } },
        scopes: { withPassword: { attributes: { include: ['password'] } } },
      },
    );
  }
}

module.exports = User;
