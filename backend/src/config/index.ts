import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:123456789@localhost:3306/restaurant_asia_dev',
  jwtSecret: process.env.JWT_SECRET || 'restaurant_asia_jwt_secret_dev_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'restaurant_asia_refresh_jwt_secret_dev_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  gracePeriodSeconds: 30,
};
