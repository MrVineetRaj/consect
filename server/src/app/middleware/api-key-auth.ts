import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { apiKeyRepository } from "../db/repository/api-key.js";
import { HeaderKeys } from "../lib/constants.js";
import { HttpResponse } from "../adapter/http.js";
import { ResponseCodes } from "../types/codes.js";

/**
 * Authenticates programmatic API requests via the `x-api-key` / `x-api-secret`
 * header pair. The public key identifies the row; the secret is verified
 * against the stored bcrypt hash. On success, `res.ctx` is populated with the
 * owning user + organization so downstream handlers work like session routes.
 */
export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const apiKey = req.header(HeaderKeys.apiKey);
  const apiSecret = req.header(HeaderKeys.apiSecret);

  const unauthorized = () =>
    res.status(ResponseCodes.UNAUTHORIZED).json({
      ...new HttpResponse({
        code: ResponseCodes.UNAUTHORIZED,
        message: "Invalid API credentials",
      }),
    });

  if (!apiKey || !apiSecret) {
    return unauthorized();
  }

  const record = await apiKeyRepository.getApiKeyByApiKey({ apiKey });
  if (!record) {
    return unauthorized();
  }

  const secretMatches = await bcrypt.compare(apiSecret, record.apiSecret);
  if (!secretMatches) {
    return unauthorized();
  }

  res.ctx = {
    organizationId: record.organizationId,
    conversationId: null,
    userId: record.userId,
    // Expose the verified credentials so downstream handlers (validated against
    // each route's `ctx` schema) can read them off `ctx`.
    apiKey,
    apiSecret,
  };

  return next();
}
