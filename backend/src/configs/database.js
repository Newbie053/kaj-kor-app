require('dotenv').config();
const pg = require('pg');
const isNeonHost = String(process.env.DB_HOST || '').includes('neon.tech');

const sharedConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
  dialectOptions: isNeonHost
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
};

module.exports = {
  development: sharedConfig,
  production: sharedConfig,
  test: sharedConfig,
};
