import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { startPeriodicCleanup } from "./services/cleanup";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add before other routes
app.use('/pdfs', express.static(path.join(process.cwd(), 'server', 'public', 'pdfs')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
//   const port = parseInt(process.env.PORT || '5000', 10);
//   server.listen(
//     {
//       port,
//       host: "127.0.0.1",
//     },
//     () => {
//       log(`Server listening on http://127.0.0.1:${port}`);
//     }
//   );
// })();

let port = parseInt(process.env.PORT || '5000', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

function listen() {
  server.listen({ port, host }, () => {
    console.log(`✅ Server listening on http://${host}:${port}`);

    // Start periodic cleanup in production (every 30 minutes, delete files older than 1 hour)
    if (process.env.NODE_ENV === 'production') {
      startPeriodicCleanup(1800000, 3600000); // 30 min interval, 1 hour max age
      console.log('🧹 Periodic cleanup task started');
    }
  });
}

// Retry with next port if current one is busy
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️ Port ${port} is busy. Trying ${++port}...`);
    listen();
  } else {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
});

listen();
})();



