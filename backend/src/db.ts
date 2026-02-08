import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "horse_user",
  password: process.env.DB_PASSWORD || "horse_pass",
  database: process.env.DB_NAME || "horse_db",
});

export default pool;