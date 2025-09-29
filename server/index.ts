// ...existing code...
import path from "path";
import net from "net";
import express from "express";
import { registerRoutes } from "./routes";
import { initializeDatabase } from "./lib/database";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
// ...existing code...

// helper: check if a port is already in use on localhost
async function isPortInUse(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(1000);
    socket.once("connect", () => {
      done = true;
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      if (!done) {
        done = true;
        resolve(false);
      }
    });
    socket.once("timeout", () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, host);
  });
}

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
    // ...existing code...

    const isProd = (process.env.NODE_ENV ?? "").toLowerCase() === "production";

    if (isProd) {
      app.use(express.static(path.join(process.cwd(), "dist/public")));

      app.get("*", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist/public/index.html"));
      });
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    }

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

    // guard: if another process is already listening on the port, fail early with clear message
    const portUsed = await isPortInUse(port);
    if (portUsed && !(server as any).listening) {
      console.error(
        `Port ${port} is already in use. Abort to avoid EADDRINUSE. ` +
          `If you're running locally, stop the process using the port or change PORT.`
      );
      process.exit(1);
    }

    // Only call listen if the server is not already listening.
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
      server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.error(`EADDRINUSE: Port ${port} already in use.`);
          process.exit(1);
        }
      });
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
