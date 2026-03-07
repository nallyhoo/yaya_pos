import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    let message = shape.message;

    // Handle Zod validation errors specifically to extract the first readable message
    if (error.cause instanceof Error && error.cause.name === 'ZodError') {
      try {
        const zodError = JSON.parse(shape.message);
        if (Array.isArray(zodError) && zodError.length > 0) {
          message = zodError[0].message;
        }
      } catch (e) {
        // Fallback to original message if parsing fails
      }
    }

    // Whitelist of "Safe" error codes where we trust the message content.
    // Everything else (INTERNAL_SERVER_ERROR, etc.) gets masked for security and professionalism.
    const safeCodes = ['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'];
    const isSafe = safeCodes.includes(error.code);

    return {
      ...shape,
      message: isSafe ? message : "An unexpected error occurred. Please try again later.",
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const managerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !['admin', 'manager'].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
