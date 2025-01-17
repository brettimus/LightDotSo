// Copyright (C) 2023 Light, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { transformer } from "../utils/transformer";
import type { Context } from "./context";
import type { OpenApiMeta } from "trpc-openapi";
import { createTRPCUpstashLimiter } from "../utils/rate-limit";
import { ZodError } from "zod";
import type { IncomingHttpHeaders } from "http";

export const root = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    /**
     * @see https://trpc.io/docs/v10/data-transformers
     */
    transformer,
    // From: https://trpc.io/docs/server/error-formatting
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === "BAD_REQUEST" && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      };
    },
  });

/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
export const router = root.router;

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
export const publicProcedure = root.procedure;

/**
 * @see https://trpc.io/docs/v10/middlewares
 */
export const middleware = root.middleware;

/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
export const mergeRouters = root.mergeRouters;

const getFingerprint = (headers?: IncomingHttpHeaders) => {
  if (!headers) {
    return "127.0.0.1";
  }
  const forwarded = headers["x-forwarded-for"];
  const ip = forwarded
    ? (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(/, /)[0]
    : "127.0.0.1";
  return ip;
};

export const rateLimiter = createTRPCUpstashLimiter({
  root,
  fingerprint: ctx => getFingerprint(ctx.headers),
  windowMs: 20000,
  message: hitInfo =>
    `Too many requests, please try again later. ${Math.ceil(
      (hitInfo.reset - Date.now()) / 1000,
    )}`,
  onLimit: hitInfo => {
    console.warn(hitInfo);
  },
  max: 5,
});

export const protectedProcedure = publicProcedure.use(opts => {
  const { session } = opts.ctx;

  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return opts.next({ ctx: { session } });
});

export const rateLimitedProcedure = publicProcedure.use(rateLimiter);
