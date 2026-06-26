import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../../env.js";
import { generateBase64String } from "../lib/utils.js";

/**
 * Cloudinary resource kinds. The AI Hub deals with documents/text (not images),
 * so we store everything as `raw` to keep the stored type deterministic — that
 * way deletes can always be issued against `raw` and won't silently miss.
 */
type CloudinaryResourceKind = "image" | "raw" | "auto";

/** MIME types we expect from the web upload form, mapped to file extensions. */
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
  "text/markdown": "md",
};

/** Pull the `<mime>` out of a `data:<mime>;base64,...` URI, if present. */
function extensionFromDataUri(content: string): string | null {
  const match = /^data:([^;,]+)[;,]/i.exec(content.trim());
  if (!match) return null;
  return MIME_TO_EXT[match[1].toLowerCase()] ?? null;
}

/** Slugify a name into a safe, slash-free public-id segment. */
function slugifySegment(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "resource"
  );
}

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
    /** Human-readable name for the asset; slashes are stripped (Cloudinary rejects them). */
    displayName?: string | null;
    /** Extension hint (e.g. "docx"); falls back to the data-URI MIME type. */
    extension?: string | null;
    resourceType?: CloudinaryResourceKind;
  }) {
    const source = this.toUploadSource(args.content);
    const ext = args.extension ?? extensionFromDataUri(source);

    // Build the public id ourselves so we fully control the path and the
    // extension. The preset's folder/filename handling can't be relied on:
    // dynamic-folder presets ignore the `folder` param for the public id, and
    // raw uploads from a data URI keep no extension. Embedding the folder path
    // and extension into the public id sidesteps both.
    const segment = `${slugifySegment(args.displayName ?? "resource")}_${generateBase64String(
      8,
    )}`;
    const withExt = ext ? `${segment}.${ext}` : segment;
    const publicId = args.folder ? `${args.folder}/${withExt}` : withExt;

    const result: UploadApiResponse = await this.client.uploader.upload(source, {
      upload_preset: env.CLOUDINARY_PRESET,
      resource_type: args.resourceType ?? "raw",
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
      // Also set the Media Library display folder for dynamic-folder presets.
      ...(args.folder ? { asset_folder: args.folder } : {}),
      ...(args.displayName
        ? { display_name: args.displayName.replace(/\//g, "-") }
        : {}),
    });

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
