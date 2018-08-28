let db = require('./models');
db.sequelize.sync({ logging: console.log, force: false })
