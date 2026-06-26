import { HttpResponse } from "../../adapter/http.js";
import { aiHubResourceRepository } from "../../db/repository/ai-hub-resource.js";
import { ResponseCodes } from "../../types/codes.js";
import type { EmbeddingStatusUpdatePropType } from "./schema.js";

class Controller {
  async embeddingStatusUpdate({ body }: EmbeddingStatusUpdatePropType) {
    await aiHubResourceRepository.updateResourceDetails({
      status: body.status,
      pointIds: body.pointIds,
      resourceId: body.resourceId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Done",
    });
  }
}

export const controller = new Controller();
