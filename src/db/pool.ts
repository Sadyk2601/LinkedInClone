import pg from "pg";
import dotenv from "dotenv";
import config from "../config/config";

dotenv.config();

let pool = new pg.Pool({
  host: process.env.HOST,
  database: process.env.DATABASE,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: "1234",
});
console.log(pool);

export default pool;
