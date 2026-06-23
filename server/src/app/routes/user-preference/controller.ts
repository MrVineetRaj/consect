import { HttpResponse } from "../../adapter/http.js";
import { userPreferenceRepository } from "../../db/repository/user-preference.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  DeleteUserPreferencePropType,
  GetUserPreferencePropType,
  UpdateUserPreferencePropType,
} from "./schema.js";

class Controller {
  async getUserPreference({ ctx }: GetUserPreferencePropType) {
    let preference = await userPreferenceRepository.getUserPreferenceByUserId({
      userId: ctx.userId,
    });

    if (!preference) {
      preference = await userPreferenceRepository.createNewUserPreference({
        userId: ctx.userId,
      });
    }

    if (!preference) {
      return new HttpResponse({
        code: ResponseCodes.SERVICE_UNAVAILABLE,
        message: "Failed to create preference",
      });
    }
    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "User preference fetched",
      result: preference,
    });
  }

  async updateUserPreference({ ctx, body }: UpdateUserPreferencePropType) {
    const newContent: { organizationId?: string | null } = {};
    if (body.organizationId !== undefined) {
      newContent.organizationId = body.organizationId;
    }

    const preference = await userPreferenceRepository.updateUserPreference({
      userId: ctx.userId,
      newContent,
    });

    if (!preference) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "User preference not found",
      });
    }

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "User preference updated",
      result: preference,
    });
  }

  async deleteUserPreference({ ctx }: DeleteUserPreferencePropType) {
    await userPreferenceRepository.deleteUserPreference({
      userId: ctx.userId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "User preference deleted",
    });
  }
}

export const controller = new Controller();
