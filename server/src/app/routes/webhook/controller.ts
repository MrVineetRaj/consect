import { HttpResponse } from "../../adapter/http.js";
import { ResponseCodes } from "../../types/codes.js";
import type { EmbeddingStatusUpdatePropType } from "./schema.js";

class Controller {
  async embeddingStatusUpdate({ body }: EmbeddingStatusUpdatePropType) {
    console.log({ body });
    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Done",
    });
  }
}

export const controller = new Controller();
