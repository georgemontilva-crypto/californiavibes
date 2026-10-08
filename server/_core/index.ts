import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerUploadRoute } from "../uploadRoute";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runMigrations } from "../migrate";
import { seedCatalogIfRequested } from "../seed";

async function startServer() {
  // Bring the schema up to date before serving traffic, so a fresh Railway
  // database provisions itself on first deploy with no manual step.
  await runMigrations();
  // After the migrations, so the tables it writes into exist on a fresh database.
  await seedCatalogIfRequested();

  const app = express();
  const server = createServer(app);

  // Railway terminates TLS in front of the container. Without this, req.ip is
  // the proxy's address and the contact form's rate limit would count every
  // visitor as the same one.
  app.set("trust proxy", 1);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Before the JSON parser: the upload route reads the raw body itself.
  registerUploadRoute(app);

  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
