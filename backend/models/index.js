const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', process.env.DB_NAME),
  logging: false
});

const Product = require('./Product')(sequelize);
const User = require('./User')(sequelize);
const Admin = require('./Admin')(sequelize);

module.exports = {
  sequelize,
  Product,
  User,
  Admin
};
