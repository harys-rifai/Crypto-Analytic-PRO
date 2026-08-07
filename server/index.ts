import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth, hashPassword } from "./auth";
import { initStorage } from "./storage";
import { initRedis } from "./redis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let redisStore: any = null;

(async () => {
  initRedis().then((store) => {
    if (store) {
      console.log("Redis session store enabled");
    } else {
      console.log("Redis unavailable, using default session store");
    }
  }).catch((err) => {
    console.error("Redis init error:", err.message);
  });

  const sessionMiddleware = setupAuth(app);
  await initStorage();

  const server = await registerRoutes(app);

  const { storage } = await import("./storage");
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    await storage.createUser({
      username: "admin",
      password: hashPassword("admin123"),
    });
    console.log("Seeded default admin user");
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
