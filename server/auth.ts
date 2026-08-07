import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
    }
  }
}

export function setupAuth(app: any, store?: any) {
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "crypto-analytic-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: store || undefined,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, { id: user.id, username: user.username });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, username: user.username });
  });

  passport.deserializeUser(async (userPayload: any, done) => {
    try {
      const user = await storage.getUser(userPayload.id);
      if (user) {
        done(null, { id: user.id, username: user.username });
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  return sessionMiddleware;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
