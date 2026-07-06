import { HttpResponse } from "../../adapter/http.js";
import { aiHubResourceRepository } from "../../db/repository/ai-hub-resource.js";
import { ResponseCodes } from "../../types/codes.js";
import { notifyUsersInBackground } from "../../workflow/notify.js";
import type { EmbeddingStatusUpdatePropType } from "./schema.js";

class Controller {
  async embeddingStatusUpdate({ body }: EmbeddingStatusUpdatePropType) {
    const updatedResource = await aiHubResourceRepository.updateResourceDetails(
      {
        status: body.status,
        pointIds: body.pointIds,
        resourceId: body.resourceId,
      },
    );

    if (updatedResource?.uploadedBy && updatedResource.organizationId) {
      notifyUsersInBackground({
        userIds: [updatedResource.uploadedBy],
        organizationId: updatedResource.organizationId,
        type:
          body.status === "success"
            ? "ai_resource_ready"
            : "ai_resource_failed",
        resourceId: updatedResource.id,
        data: { resourceName: updatedResource.name },
      });
    }

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Done",
    });
  }
}

export const controller = new Controller();
