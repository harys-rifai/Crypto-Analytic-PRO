import pkg from "pg";
const { Pool } = pkg;
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Password09!@localhost:5008/cryptoanalyze";
const pool = new Pool({ connectionString });

async function migrate() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(process.cwd(), "migrations", "add_user_session_tracking.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await client.query(sql);
    console.log("Migration applied successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
