import { Router, type RequestHandler } from "express";
import type { ZodObject } from "zod";
import {
  createDocument,
  type ZodOpenApiOperationObject,
  type ZodOpenApiPathsObject,
} from "zod-openapi";
import { AsyncHttpHandler, type HttpResponse } from "./http.js";
import { env } from "../../env.js";

type Method = "get" | "post" | "put" | "patch" | "delete";

/** Accumulates every route registered through `createApiRouter`. */
export const openApiPaths: ZodOpenApiPathsObject = {};

/**
 * Name of the security scheme used by auth-protected routes. better-auth's
 * bearer plugin authenticates via an `Authorization: Bearer <token>` header.
 */
const SESSION_SECURITY_SCHEME = "bearerAuth";

type RouteConfig = {
  /** Request schema shaped as `{ body?, query?, params? }` (same one used for validation). */
  schema?: ZodObject;
  /** Schema describing the 200 response body. */
  response?: ZodObject;
  /** Zod object whose keys are required/optional request headers, e.g. `{ "x-organization-id": z.string() }`. */
  headers?: ZodObject;
  /** When true, the route is documented as requiring an authenticated session. */
  auth?: boolean;
  /** Already-bound controller method. */
  handler: (args?: any) => Promise<HttpResponse>;
  summary?: string;
  description?: string;
  tags?: string[];
};

/** `(path, ...middlewares, config)` — mirrors Express's `router.post(path, ...handlers)`. */
type RouteArgs = [...middlewares: RequestHandler[], config: RouteConfig];

/** Express `:id` -> OpenAPI `{id}`. */
function toOpenApiPath(path: string): string {
  return env.BETTER_AUTH_URL + path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function joinPath(base: string, path: string): string {
  const joined = `${base}/${path}`.replace(/\/{2,}/g, "/");
  return joined.length > 1 ? joined.replace(/\/$/, "") : joined;
}

/**
 * Creates an Express router whose route registrations are simultaneously
 * recorded into the OpenAPI document. `basePath` must match where the router
 * is mounted in `express.ts` so the documented paths line up with reality.
 */
export function createApiRouter(basePath: string) {
  const router = Router();

  function register(
    method: Method,
    path: string,
    middlewares: RequestHandler[],
    config: RouteConfig,
  ) {
    // 1. Mount the Express route — middlewares run before the handler.
    router[method](
      path,
      ...middlewares,
      AsyncHttpHandler(config.handler, config.schema),
    );

    // 2. Record the same metadata for the OpenAPI spec.
    const shape = config.schema?.shape as
      | { body?: ZodObject; query?: ZodObject; params?: ZodObject }
      | undefined;

    const operation: ZodOpenApiOperationObject = {
      ...(config.summary && { summary: config.summary }),
      ...(config.description && { description: config.description }),
      ...(config.tags && { tags: config.tags }),
      ...(config.auth && { security: [{ [SESSION_SECURITY_SCHEME]: [] }] }),
      ...((shape?.query || shape?.params || config.headers) && {
        requestParams: {
          ...(shape?.query && { query: shape.query }),
          ...(shape?.params && { path: shape.params }),
          ...(config.headers && { header: config.headers }),
        },
      }),
      ...(shape?.body && {
        requestBody: {
          content: { "application/json": { schema: shape.body } },
        },
      }),
      responses: {
        "200": {
          description: "Successful response",
          ...(config.response && {
            content: { "application/json": { schema: config.response } },
          }),
        },
      },
    };

    const fullPath = toOpenApiPath(joinPath(basePath, path));
    openApiPaths[fullPath] = { ...openApiPaths[fullPath], [method]: operation };
  }

  /** Splits `(...middlewares, config)` and registers the route. */
  function method(verb: Method) {
    return (path: string, ...args: RouteArgs) => {
      const config = args[args.length - 1] as RouteConfig;
      const middlewares = args.slice(0, -1) as RequestHandler[];
      register(verb, path, middlewares, config);
    };
  }

  return {
    router,
    get: method("get"),
    post: method("post"),
    put: method("put"),
    patch: method("patch"),
    delete: method("delete"),
  };
}

/**
 * Builds the OpenAPI document from everything registered so far. Call this
 * after all route modules have been imported (i.e. inside app bootstrap).
 */
export function buildOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: { title: "Consect API", version: "1.0.0" },
    components: {
      securitySchemes: {
        [SESSION_SECURITY_SCHEME]: {
          type: "http",
          scheme: "bearer",
          // better-auth's bearer plugin returns the session token to send as
          // `Authorization: Bearer <token>`.
          bearerFormat: "Session Token",
        },
      },
    },
    paths: openApiPaths,
  });
}
