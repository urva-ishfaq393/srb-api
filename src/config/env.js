require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUrl: process.env.MONGODB_URL,
  adminKey: process.env.ADMIN_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};
