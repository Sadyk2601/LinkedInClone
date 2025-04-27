import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
  dbDatabase: string;
  jwtSecret: string;
  jwtExpire: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT) || 5432,
  dbUsername: process.env.DB_USERNAME || "your_username",
  dbPassword: process.env.DB_PASSWORD || "your_password",
  dbDatabase: process.env.DB_DATABASE || "your_database",
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
  jwtExpire: process.env.JWT_EXPIRES_IN || "3600000",
};

export default config;
