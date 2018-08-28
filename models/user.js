module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 40],
          msg: 'First Name length should range between 2 - 40 characters'
        }
      },
      set(value) {
        this.setDataValue('firstname', value.trim());
      }
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 40],
          msg: 'Last Name length should range between 2 - 40 characters'
        }
      },
      set(value) {
        this.setDataValue('lastname', value.trim());
      }
    },
    spice: DataTypes.INTEGER,
    email: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: {
        args: true,
        msg: 'Oops. There is an existing account with this email.'
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'The email you entered is invalid.'
        }
      },
      set(value) {
        this.setDataValue('email', value.trim().toLowerCase());
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resetPasswordToken: {
      type:DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type:DataTypes.DATE,
      allowNull: true
    }
  }, {
    paranoid:true,
    indexes: [
      {
        fields: ['resetPasswordToken']
      },
      {
        fields: ['email']
      },
    ],
    defaultScope: {
      attributes:['id','firstname','lastname','email']
    },
    scopes: {
      login:{
        //return data only used at login
        attributes:['id','firstname','lastname','email','password','spice']
      },
      auth:{
        //this data will be available to all our API endpoints via request.user
        'attributes':['id','firstname','lastname','email']
      },
      logout:{
        attributes:['spice']
      },
      reset:{
        attributes:['id','resetPasswordToken','resetPasswordExpires','email']
      },
      resetPasswordEmail:{
        attributes:['id','name','email']
      }
    }
  });

  User.associate = (models)=>{
    // associations can be defined here
    User.hasMany(models.ShortUrl);
    User.belongsToMany(models.LongUrl, {
      through: 'UserLongUrl',
      foreignKey: 'userId',
    });
  }
  return User;
};