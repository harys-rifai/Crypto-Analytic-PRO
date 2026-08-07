import type { IStorage } from "./storage-base";
import { MemStorage } from "./storage-mem";
import { DbStorage } from "./storage-pg";

export let storage: IStorage = new MemStorage();

export async function initStorage() {
  try {
    const pgStorage = new DbStorage();
    await pgStorage.getCryptocurrencies(1);
    storage = pgStorage;
    console.log("Storage initialized: PostgreSQL");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    try {
      const { sqliteStorage } = await import("./storage-sqlite");
      storage = sqliteStorage;
      console.log("Storage initialized: SQLite fallback");
    } catch (sqliteError) {
      console.error("SQLite fallback also failed:", sqliteError);
      storage = new MemStorage();
      console.log("Storage initialized: In-memory fallback");
    }
  }
}
