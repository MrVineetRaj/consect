import { HttpResponse } from "../../adapter/http.js";
import { cloudinaryClient } from "../../clients/cloudinary.js";
import { aiHubResourceRepository } from "../../db/repository/ai-hub-resource.js";
import { ResponseCodes } from "../../types/codes.js";
import { vectorDB } from "../../vector_db/client.js";
import type {
  CreateResourcePropType,
  DeleteResourcePropType,
  ListResourcesPropType,
  UpdateResourceMetaPropType,
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

    const result = await aiHubResourceRepository.createResource({
      organizationId: ctx.organizationId,
      type: body.type,
      name: body.name ?? null,
      description: body.description ?? null,
      tags: body.tags,
      allowedChannelIds: body.allowedChannelIds,
      publicId,
      secureURL,
      status: "processing",
      embeddingIds: [],
    });

    // Kick off embedding without blocking the response. The embedding service
    // flips the row to "success" once it finishes; if we can't even reach it,
    // mark the resource "failed" so the client can surface the error.
    void fetch("http://localhost:8000/embed_document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    }).catch(async () => {
      await aiHubResourceRepository.updateResourceDetails({
        resourceId: result!.id,
        pointIds: [],
        status: "failed",
      });
    });

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Resource added to AI Hub",
      result,
    });
  }

  async updateResourceMeta({ ctx, body }: UpdateResourceMetaPropType) {
    const resource = await aiHubResourceRepository.getResourceById({
      id: body.id,
    });
    if (!resource || resource.organizationId !== ctx.organizationId) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Resource not found",
      });
    }

    const result = await aiHubResourceRepository.updateResourceMeta({
      resourceId: body.id,
      name: body.name,
      description: body.description,
      allowedChannelIds: body.allowedChannelIds,
      tags: body.tags,
    });

    // Mirror the editable metadata onto every embedding point so access scoping
    // (allowedChannelIds) and search context (name/description/tags) stay in
    // sync with the row. Only the provided keys are merged into each payload.
    const payload: Record<string, unknown> = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.description !== undefined) payload.description = body.description;
    if (body.allowedChannelIds !== undefined)
      payload.allowedChannelIds = body.allowedChannelIds;
    if (body.tags !== undefined) payload.tags = body.tags;

    if (Object.keys(payload).length > 0 && resource.embeddingIds?.length) {
      await vectorDB.setEmbeddingsPayload({
        collection: resource.organizationId!,
        ids: resource.embeddingIds,
        payload,
      });
    }

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Resource updated",
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

    if (resource?.embeddingIds) {
      await vectorDB.deleteEmbedding({
        collection: resource.organizationId!,
        ids: resource.embeddingIds,
      });
    }

    await aiHubResourceRepository.deleteResource({ id: body.id });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Resource removed from AI Hub",
    });
  }
}

export const controller = new Controller();
