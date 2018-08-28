module.exports = (sequelize, DataTypes) => {
  const LongUrl = sequelize.define('LongUrl', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isURL: {
          msg: 'Invalid URL'
        }
      },
      set(value) {
        this.setDataValue('url', value.trim());
      }
    },
    visits: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    paranoid:true,
    defaultScope: {
      attributes:['id','url','visits']
    }
  });
  LongUrl.associate = (models) => {
      // associations can be defined here
      LongUrl.belongsToMany(models.User, {
        through: 'UserLongUrl',
        foreignKey: 'longId'
      });
      LongUrl.hasMany(models.ShortUrl, {
        foreignKey: 'longId'
      });
    }
  return LongUrl;
};