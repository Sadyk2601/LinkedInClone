import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  host: "localhost",
  user: "postgres",
  password: "1234",
  database: "exam",
  port: 5432,
});

export default pool;
