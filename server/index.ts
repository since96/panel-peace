import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDirectAuth } from "./direct-auth";
import { setupStudioAuth } from "./studio-auth";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Set up authentication systems
console.log("Setting up direct authentication with JWT...");
setupDirectAuth(app);
console.log("Direct authentication setup complete");

console.log("Setting up studio authentication system...");
setupStudioAuth(app);
console.log("Studio authentication setup complete");

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

  // Setup static file serving and client routing
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Serve static files from the public directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Handle client-side routing - send index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  // Only start the server if not in Vercel
  if (process.env.VERCEL !== '1') {
    const port = process.env.PORT || 3000;
    const host = '0.0.0.0';
    server.listen({
      port,
      host,
      ipv6Only: false,
    }, () => {
      log(`Server running at:`);
      log(`- Local: http://localhost:${port}`);
      log(`- Network: http://${host}:${port}`);
    });
  }
})();

// Export the Express app for Vercel
export default app;
