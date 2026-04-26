import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URI,

  // ✅ Required if you're using cloud DB (Neon, Supabase, Railway)
  ssl: {
    rejectUnauthorized: false,
  },
});

// ✅ Catch silent crashes
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});