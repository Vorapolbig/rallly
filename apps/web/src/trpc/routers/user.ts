import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { posthog } from "@/features/analytics/posthog";
import { defineAbilityFor } from "@/features/user/ability";
import {
  deleteImageFromS3,
  getImageUploadUrl,
} from "@/lib/storage/image-upload";
import { timezoneSchema } from "@/utils/timezone-schema";
import {
  createRateLimitMiddleware,
  privateProcedure,
  publicProcedure,
  router,
} from "../trpc";

export const user = router({
  getMe: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return ctx.user;
  }),
  getAuthed: privateProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  changeName: privateProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
  updatePreferences: privateProcedure
    .input(
      z.object({
        locale: z.string().optional(),
        timeZone: timezoneSchema.optional(),
        weekStart: z.number().min(0).max(6).optional(),
        timeFormat: z.enum(["hours12", "hours24"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.isGuest) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Guest users cannot update preferences",
        });
      }

      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: input,
      });

      return { success: true };
    }),
  getAvatarUploadUrl: privateProcedure
    .use(createRateLimitMiddleware("get_avatar_upload_url", 10, "1 h"))
    .input(
      z.object({
        fileType: z.enum(["image/jpeg", "image/png"]),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await getImageUploadUrl({
        keyPrefix: "avatars",
        entityId: ctx.user.id,
        fileType: input.fileType,
        fileSize: input.fileSize,
      });
    }),
  updateAvatar: privateProcedure
    .input(z.object({ imageKey: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const expectedPrefix = `avatars/${userId}-`;
      if (!input.imageKey.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image key",
        });
      }

      const oldImageKey = ctx.user.image;

      await prisma.user.update({
        where: { id: userId },
        data: { image: input.imageKey },
      });

      if (oldImageKey) {
        await deleteImageFromS3(oldImageKey);
      }

      return { success: true };
    }),
  removeAvatar: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const oldImageKey = ctx.user.image;

    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    const isInternalAvatar = oldImageKey && !oldImageKey.startsWith("https://");

    if (isInternalAvatar) {
      await deleteImageFromS3(oldImageKey);
    }

    return { success: true };
  }),
  deleteMe: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const ability = defineAbilityFor(ctx.user);

    if (ability.cannot("delete", subject("User", user))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this user",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }),
  updateLocale: privateProcedure
    .input(z.object({ locale: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { locale: input.locale },
      });
    }),
});
