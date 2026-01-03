const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const dbConfig = require('../configs/database');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const db = {};
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Sync DB
//sequelize.sync().then(() => console.log('✅ DB synced'));
// in your main Sequelize sync file
sequelize.sync({ force: true },
   console.log('✅ DB synced with force true')

); // ⚠️ WARNING: deletes all existing Tasks

module.exports = db;
