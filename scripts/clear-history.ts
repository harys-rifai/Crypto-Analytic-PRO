import { storage } from "../server/storage";

async function clearBadHistory() {
  console.log("Clearing bad history data...");
  
  // Clear stock history
  const stockHistory = await storage.getStockHistory("bbca", 1);
  console.log(`Current stock history records: ${stockHistory.length}`);
  
  // Clear gold history  
  const goldHistory = await storage.getGoldHistory("xau-idr", 1);
  console.log(`Current gold history records: ${goldHistory.length}`);
  
  // We need to clear via direct DB access since storage doesn't have delete methods
  console.log("Please run db:push or manually clear history tables if needed");
}

clearBadHistory().catch(console.error);
