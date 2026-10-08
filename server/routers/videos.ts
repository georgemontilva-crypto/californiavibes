import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminAuthedProcedure, appRouterFactory, publicProc } from "../appTrpc";
import * as db from "../db";
import { isStorageConfigured, storageDelete } from "../storage";

/** Removes objects from R2, logging instead of throwing so a row can still go. */
async function removeFromStorage(keys: (string | null | undefined)[]) {
  if (!isStorageConfigured()) return;
  for (const key of keys) {
    if (!key) continue;
    try {
      await storageDelete(key);
    } catch (err) {
      console.warn(`[videos] failed to delete ${key} from R2:`, err);
    }
  }
}

export const videosRouter = appRouterFactory({
  /** Published clips for the home page, the hero clip first. */
  publicList: publicProc.query(async () => {
    const rows = await db.listVideos({ publishedOnly: true });
    return rows.map(v => ({
      id: v.id,
      title: v.title,
      fileUrl: v.fileUrl,
      posterUrl: v.posterUrl,
      featured: v.featured,
    }));
  }),

  adminList: adminAuthedProcedure.query(() => db.listVideos()),

  create: adminAuthedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        fileUrl: z.string().min(1).max(1024),
        fileKey: z.string().min(1).max(512),
        posterUrl: z.string().max(1024).nullable().optional(),
        posterKey: z.string().max(512).nullable().optional(),
        sizeBytes: z.number().int().nonnegative().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.createVideo({
        title: input.title.trim(),
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        posterUrl: input.posterUrl ?? null,
        posterKey: input.posterKey ?? null,
        sizeBytes: input.sizeBytes ?? null,
      });
      return { success: true };
    }),

  update: adminAuthedProcedure
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().min(1).max(255).optional(),
        sortOrder: z.number().int().optional(),
        published: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, featured, ...rest } = input;
      if (!(await db.getVideoById(id))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }
      await db.updateVideo(id, rest);
      if (featured !== undefined) await db.setFeaturedVideo(id, featured);
      return { success: true };
    }),

  delete: adminAuthedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const video = await db.getVideoById(input.id);
      if (video) await removeFromStorage([video.fileKey, video.posterKey]);
      await db.deleteVideo(input.id);
      return { success: true };
    }),
});
