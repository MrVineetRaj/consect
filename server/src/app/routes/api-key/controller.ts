import bcrypt from "bcryptjs";
import { HttpResponse } from "../../adapter/http.js";
import { apiKeyRepository } from "../../db/repository/api-key.js";
import { generateBase64String } from "../../lib/utils.js";
import { ResponseCodes } from "../../types/codes.js";

const SALT_ROUNDS = 10;
import type {
  CreateApiKeyPropType,
  DeleteApiKeyPropType,
  ListApiKeysPropType,
} from "./schema.js";

class Controller {
  async createApiKey({ ctx, body }: CreateApiKeyPropType) {
    // The public identifier (`apiKey`) is safe to display; the `apiSecret` is
    // only returned here, at creation time, and never again on listing.
    const apiKey = `ck_${generateBase64String(32)}`;
    const apiSecret = `cs_${generateBase64String(48)}`;

    // Only the bcrypt hash of the secret is persisted — the plaintext below is
    // the sole copy the caller ever receives, so they must store it now.
    const hashedSecret = await bcrypt.hash(apiSecret, SALT_ROUNDS);

    const result = await apiKeyRepository.createNewApiKey({
      name: body.name ,
      apiKey,
      apiSecret: hashedSecret,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "API key created",
      // Swap the stored hash for the plaintext secret in the response only.
      result: { ...result, apiSecret },
    });
  }

  async listApiKeys({ ctx }: ListApiKeysPropType) {
    const keys = await apiKeyRepository.getApiKeys({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    // Never expose the secret on listing; the caller only saw it once, when the
    // key was created.
    const result = keys.map(({ apiSecret, ...rest }) => rest);

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched API keys",
      result,
    });
  }

  async deleteApiKey({ ctx, body }: DeleteApiKeyPropType) {
    const deleted = await apiKeyRepository.deleteApiKey({
      id: body.id,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    if (!deleted) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "API key not found",
      });
    }

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "API key deleted",
    });
  }
}

export const controller = new Controller();
