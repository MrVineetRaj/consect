import { HttpResponse } from "../../adapter/http.js";
import { cloudinaryClient } from "../../clients/cloudinary.js";
import { aiHubResourceRepository } from "../../db/repository/ai-hub-resource.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  CreateResourcePropType,
  DeleteResourcePropType,
  ListResourcesPropType,
} from "./schema.js";

class Controller {
  async createResource({ ctx, body }: CreateResourcePropType) {
    // Persist the source on Cloudinary first; `content` is a URL, pasted text,
    // or a base64 data URI of an uploaded file (see the web upload form).
    const { publicId, secureURL } = await cloudinaryClient.uploadResource({
      content: body.content,
      folder: `consect/ws_${ctx.organizationId}/ai_hub`,
    });

    // TODO: run `body.content` through the embedding pipeline (vector_db) and
    // store the returned vector id. Until that exists we persist the resource
    // metadata with a null embeddingId.
    const embeddingId: string | null = null;

    const result = await aiHubResourceRepository.createResource({
      organizationId: ctx.organizationId,
      type: body.type,
      tags: body.tags,
      allowedChannelIds: body.allowedChannelIds,
      publicId,
      secureURL,
      embeddingId,
    });

    fetch("http://localhost:8000/embed_document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    }).catch((e) => {
      return new HttpResponse({
        code: ResponseCodes.SERVICE_UNAVAILABLE,
        message: "Failed to embed document",
      });
    });

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Resource added to AI Hub",
      result,
    });
  }

  async listResources({ ctx }: ListResourcesPropType) {
    const result = await aiHubResourceRepository.getResourcesByOrganizationId({
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched AI Hub resources",
      result,
    });
  }

  async deleteResource({ body }: DeleteResourcePropType) {
    // Drop the underlying Cloudinary asset before removing the row so we don't
    // orphan it; the public id is only recoverable while the row still exists.
    const resource = await aiHubResourceRepository.getResourceById({
      id: body.id,
    });
    if (resource?.publicId) {
      await cloudinaryClient.deleteResource({ publicId: resource.publicId });
    }

    await aiHubResourceRepository.deleteResource({ id: body.id });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Resource removed from AI Hub",
    });
  }
}

export const controller = new Controller();
