import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../../env.js";

/**
 * Cloudinary resource kinds. The AI Hub deals with documents/text (not images),
 * so we store everything as `raw` to keep the stored type deterministic — that
 * way deletes can always be issued against `raw` and won't silently miss.
 */
type CloudinaryResourceKind = "image" | "raw" | "auto";

class CloudinaryClient {
  private client;
  constructor() {
    this.client = cloudinary;
    this.client.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  /**
   * Cloudinary's uploader accepts a remote URL or a base64 data URI as-is. A
   * pasted string (raw text/markdown) is neither, so we wrap it into a UTF-8
   * data URI before handing it over.
   */
  private toUploadSource(content: string) {
    const trimmed = content.trim();
    if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed;
    return `data:text/plain;base64,${Buffer.from(content, "utf-8").toString(
      "base64",
    )}`;
  }

  /** Upload a resource and return the bits we persist on the resource row. */
  async uploadResource(args: {
    content: string;
    /** Folder to store the asset under, e.g. `consect/ws_<id>/ai_hub`. */
    folder?: string;
    resourceType?: CloudinaryResourceKind;
  }) {
    const result: UploadApiResponse = await this.client.uploader.upload(
      this.toUploadSource(args.content),
      {
        upload_preset: env.CLOUDINARY_PRESET,
        resource_type: args.resourceType ?? "raw",
        ...(args.folder ? { folder: args.folder } : {}),
      },
    );

    return { publicId: result.public_id, secureURL: result.secure_url };
  }

  /** Remove a previously uploaded resource by its public id. */
  async deleteResource(args: {
    publicId: string;
    resourceType?: CloudinaryResourceKind;
  }) {
    return this.client.uploader.destroy(args.publicId, {
      resource_type: args.resourceType ?? "raw",
      invalidate: true,
    });
  }
}

export const cloudinaryClient = new CloudinaryClient();
