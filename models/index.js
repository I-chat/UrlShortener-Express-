let fs = require('fs');
let path = require('path');
let Sequelize = require('sequelize');
let basename = path.basename(module.filename);
let config = require(__dirname + '/../config/database.json')[process.env.NODE_ENV];
let db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter((file)=> {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach((file)=> {
    let model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName)=> {
  //setup relationships
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

Object.keys(db).forEach((modelName)=> {
  //add scopes after relationships
  if (db[modelName].addScopes) {
    db[modelName].addScopes(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
