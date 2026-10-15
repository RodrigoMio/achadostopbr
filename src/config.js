import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  authPath: process.env.AUTH_PATH || 'auth_info',
};
