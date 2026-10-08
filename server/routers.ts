import { appRouterFactory } from "./appTrpc";
import { adminAuthRouter } from "./routers/adminAuth";
import { catalogRouter } from "./routers/catalog";
import { siteRouter } from "./routers/site";
import { storeRouter } from "./routers/store";
import { videosRouter } from "./routers/videos";

export const appRouter = appRouterFactory({
  adminAuth: adminAuthRouter,
  catalog: catalogRouter,
  videos: videosRouter,
  site: siteRouter,
  store: storeRouter,
});

export type AppRouter = typeof appRouter;
