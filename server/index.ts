import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite"; // removed setupVite from static import
import { initializeDatabase } from "./lib/database";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path; // renamed to avoid shadowing `path` module
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database connection first
    const dbInitialized = await initializeDatabase();

    // Import storage-related functions after database initialization
    const { fallbackToMemoryStorage, setStorageImplementation } = await import(
      "./storage-manager"
    );

    if (!dbInitialized) {
      fallbackToMemoryStorage();
    } else {
      setStorageImplementation("database");
    }

    // Register API routes and get HTTP server
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Normalize NODE_ENV and choose behavior
    const isProd = (process.env.NODE_ENV ?? "").toLowerCase() === "production";

    // Set up Vite or static file serving
    if (isProd) {
      const __dirname = path.resolve();
      app.use(express.static(path.join(__dirname, "dist/public")));

      // Catch-all: send index.html for React/Vite routes
      app.get("*", (_req, res) => {
        res.sendFile(path.join(__dirname, "dist/public", "index.html"));
      });
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    }

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

    // Only call listen if the server is not already listening.
    // Some startup paths (e.g. vite dev server or registerRoutes) may have
    // already started the underlying http.Server. Guarding avoids EADDRINUSE.
    if (!(server as any).listening) {
      server.listen(
        {
          port,
          host: "0.0.0.0",
        },
        () => {
          console.log(
            `Server listening on port ${port} (NODE_ENV=${process.env.NODE_ENV})`
          );
        }
      );
    } else {
      console.log(
        `Server already listening (NODE_ENV=${process.env.NODE_ENV})`
      );
    }
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
})();
