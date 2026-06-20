import { HttpResponse } from "../../adapter/http.js";
import { ResponseCodes } from "../../types/codes.js";

class Controller {
  async getHealth() {
    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Server is up and running since 1996",
    });
  }
}

export const controller = new Controller();
