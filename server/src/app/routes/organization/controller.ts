import { HttpResponse } from "../../adapter/http.js";
import { organizationRepository } from "../../db/repository/organization.js";
import { generateBase64String } from "../../lib/utils.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  CreateOrganizationPropType,
  ListOrganizationsPropType,
} from "./schema.js";

/** Turns a free-form name into a url-safe slug fragment. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

class Controller {
  async listOrganizations({ ctx }: ListOrganizationsPropType) {
    const organizations = await organizationRepository.getUserOrganizations({
      userId: ctx.userId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Organizations fetched",
      result: organizations,
    });
  }

  async createOrganization({ ctx, body }: CreateOrganizationPropType) {
    // Build a unique slug from the name, retrying with a random suffix on
    // collision so two organizations can share a display name.
    const base = slugify(body.name) || "org";
    let slug = base;
    let attempts = 0;
    while (await organizationRepository.getOrganizationBySlug({ slug })) {
      slug = `${base}-${generateBase64String(6).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      if (++attempts > 5) break;
    }

    const organization = await organizationRepository.createOrganization({
      userId: ctx.userId,
      name: body.name,
      slug,
      logo: body.logo ?? null,
    });

    if (!organization) {
      return new HttpResponse({
        code: ResponseCodes.SERVICE_UNAVAILABLE,
        message: "Failed to create organization",
      });
    }

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Organization created",
      result: organization,
    });
  }
}

export const controller = new Controller();
