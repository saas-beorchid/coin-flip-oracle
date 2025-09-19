// server.ts
import express, { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import bodyParser from "body-parser";
import { storage } from "./storage-manager";
import { getAISuggestion } from "./lib/openai";
import { flipHistorySchema } from "@shared/schema";
import Stripe from "stripe";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

// ✅ Use a valid Stripe API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Cache implementation
class Cache<T> {
  private cache: Map<string, { value: T; expiry: number }>;

  constructor(private defaultTtl: number = 60000) {
    this.cache = new Map();
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, { value, expiry: Date.now() + ttl });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

const statsCache = new Cache<{
  headsCount: number;
  tailsCount: number;
  totalCount: number;
}>(30000);
const historyCache = new Cache<any[]>(10000);
const settingsCache = new Cache<any>(600000);

// ✅ Schema just for settings (safer than reusing flipHistorySchema)
const settingsSchema = z.object({
  headsLabel: z.string(),
  tailsLabel: z.string(),
  coinStyle: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const addCacheHeaders = (res: Response, maxAge: number) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
    res.setHeader(
      "Expires",
      new Date(Date.now() + maxAge * 1000).toUTCString()
    );
  };

  // ✅ Stripe webhook FIRST (before bodyParser.json)
  app.post(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      try {
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id || "default";
          await storage.setPaymentStatus(userId, true);
        }
        res.json({ received: true });
      } catch (error) {
        res.status(400).json({ error: "Webhook error" });
      }
    }
  );

  // ✅ Apply body parser AFTER webhook
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get("/api/history", async (req, res) => {
    try {
      const cachedHistory = historyCache.get("all");
      if (cachedHistory) {
        addCacheHeaders(res, 10);
        return res.json(cachedHistory);
      }
      const flipHistory = await storage.getAllFlipHistory();
      historyCache.set("all", flipHistory);
      addCacheHeaders(res, 10);
      res.json(flipHistory);
    } catch {
      res.status(500).json({ message: "Failed to fetch flip history" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const cachedStats = statsCache.get("all");
      if (cachedStats) {
        addCacheHeaders(res, 30);
        return res.json(cachedStats);
      }
      const stats = await storage.getFlipStats();
      statsCache.set("all", stats);
      addCacheHeaders(res, 30);
      res.json(stats);
    } catch {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.post("/api/flip", async (req, res) => {
    try {
      const flipData = flipHistorySchema.parse(req.body);
      if (flipData.context) {
        flipData.aiSuggestion = await getAISuggestion(
          flipData.outcome,
          flipData.context,
          flipData.headsLabel,
          flipData.tailsLabel
        );
      }
      const newFlip = await storage.addFlipToHistory(flipData);
      historyCache.invalidateAll();
      statsCache.invalidateAll();
      res.status(201).json(newFlip);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Validation error",
          errors: validationError.details,
        });
      } else {
        res.status(500).json({ message: "Failed to add flip to history" });
      }
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { amount, currency, success_url, cancel_url, userId } = req.body;
      const origin =
        req.headers.origin ||
        process.env.DEFAULT_ORIGIN ||
        "http://localhost:5000";
      const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency || "usd",
              product_data: { name: "Coin Flip Oracle - Premium Access" },
              // ✅ Amount in cents, not float
              unit_amount: Math.round((amount || 0) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        client_reference_id: userId,
        success_url:
          success_url ||
          `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&payment=success`,
        cancel_url: cancel_url || `${baseUrl}/?payment=cancelled`,
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/check-payment", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || "default";
      const hasPaid = await storage.getPaymentStatus(userId);
      addCacheHeaders(res, 30);
      res.json({ hasPaid });
    } catch {
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  app.post("/api/payment-success", async (req, res) => {
    try {
      const { sessionId, userId } = req.body;
      if (!sessionId || !userId) {
        return res
          .status(400)
          .json({ message: "Session ID and User ID required" });
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.payment_status === "paid" &&
        session.client_reference_id === userId
      ) {
        await storage.setPaymentStatus(userId, true);
        res.json({ success: true, message: "Payment status updated" });
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch {
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.delete("/api/history", async (req, res) => {
    try {
      await storage.clearFlipHistory();
      historyCache.invalidateAll();
      statsCache.invalidateAll();
      res
        .status(200)
        .json({ message: "Flip history and statistics cleared successfully" });
    } catch {
      res.status(500).json({ message: "Failed to clear flip history" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const cachedSettings = settingsCache.get("current");
      if (cachedSettings) {
        addCacheHeaders(res, 600);
        return res.json(cachedSettings);
      }
      const settings = await storage.getCoinSettings();
      const finalSettings = settings || {
        id: 1,
        headsLabel: "HEADS",
        tailsLabel: "TAILS",
        coinStyle: "default",
      };
      settingsCache.set("current", finalSettings);
      addCacheHeaders(res, 600);
      res.json(finalSettings);
    } catch {
      res.status(500).json({ message: "Failed to fetch coin settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settings = settingsSchema.parse(req.body);
      const updatedSettings = await storage.updateCoinSettings(settings);
      settingsCache.invalidateAll();
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Validation error",
          errors: validationError.details,
        });
      } else {
        res.status(500).json({ message: "Failed to update coin settings" });
      }
    }
  });

  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: "unknown",
        storage: "unknown",
      };
      try {
        await storage.getFlipStats();
        health.database = "connected";
        health.storage = "operational";
      } catch {
        health.database = "error";
        health.storage = "error";
      }
      res.status(200).json(health);
    } catch {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Start server
if (isMainModule) {
  const app = express();
  registerRoutes(app).then((server) => {
    const port = parseInt(process.env.PORT || "5000", 10);
    // ✅ Bind to 0.0.0.0 for Replit/Heroku/etc.
    server.listen(port, "0.0.0.0", () => {});
  });
}
