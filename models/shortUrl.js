module.exports = (sequelize, DataTypes) => {
  const ShortUrl = sequelize.define('ShortUrl', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('url', value.trim());
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    visits: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    defaultScope: {
      attributes:['id','url','active','visits','longId','userId']
    }
  });
  ShortUrl.associate = (models) => {
      // associations can be defined here
      ShortUrl.belongsTo(models.User, {
        foreignKey: {
          field: 'userId'
        }
      });
      ShortUrl.belongsTo(models.LongUrl, {
        foreignKey: 'longId'
      });
    }
  return ShortUrl;
};