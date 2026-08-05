require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret_change_me',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
    sslCaPath: process.env.DB_SSL_CA, // path to a downloaded CA cert; leave unset for local MySQL
  },
  bakong: {
    accountId: process.env.BAKONG_ACCOUNT_ID, // e.g. "yourname@aclb" — from your bank's Bakong profile
    merchantName: process.env.BAKONG_MERCHANT_NAME || 'Trendora',
    merchantCity: process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh',
    devToken: process.env.BAKONG_DEV_TOKEN, // from https://api-bakong.nbc.gov.kh (developer portal)
  },
};