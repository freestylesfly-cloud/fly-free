import { BadRequestException, Logger } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

/**
 * Storefront media lives on Cloudinary.
 *
 * It used to be Supabase Storage, until the project was restricted for cached
 * egress and every read started returning 402 — see
 * scripts/migrate-media-to-cloudinary.mjs. Everything that stores or removes a
 * file goes through here so the provider is named in exactly one place.
 *
 * Configured by CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud>), which the
 * SDK reads from the environment on its own. It must be set where the API runs
 * (Railway), not on the frontend hosts.
 */

const logger = new Logger("MediaStorage");

/** Every asset sits under this root, mirroring the old Supabase bucket name. */
const ROOT_FOLDER = "product-images";

/** Cloudinary files audio under "video"; it has no separate audio type. */
type ResourceType = "image" | "video";

export function resourceTypeFor(mimeType: string): ResourceType {
  return mimeType.startsWith("image/") ? "image" : "video";
}

function config() {
  const cfg = cloudinary.config();
  if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
    logger.error("Media upload blocked: CLOUDINARY_URL is missing on the API server");
    throw new BadRequestException(
      "Media storage is not configured: CLOUDINARY_URL missing on the API server. Set it where the API is deployed, not on the frontend host."
    );
  }
  return cfg as Required<Pick<typeof cfg, "cloud_name" | "api_key" | "api_secret">>;
}

/** `themes/spider-man/banner` → `product-images/themes/spider-man/banner/<ts>-<rand>` */
function newPublicId(folder: string) {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "misc";
  return `${ROOT_FOLDER}/${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function uploadMediaBuffer(buffer: Buffer, mimeType: string, folder = "misc"): Promise<string> {
  config();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: newPublicId(folder), resource_type: resourceTypeFor(mimeType), overwrite: false },
        (error, response) => (error || !response ? reject(error) : resolve(response))
      )
      .end(buffer);
  }).catch((error) => {
    const message = error?.message || "upload rejected";
    logger.error(`Media upload failed: ${message}`);
    throw new BadRequestException(`Failed to upload media: ${message}`);
  });

  return result.secure_url;
}

/**
 * Signed parameters for a browser to upload a large file (video, audio) straight
 * to Cloudinary, so the bytes skip the API and its JSON body limit while the
 * secret stays here. The browser POSTs the file plus `fields` to `uploadUrl`
 * and reads `secure_url` from the response.
 */
export function signedDirectUpload(mimeType: string, folder = "misc") {
  const cfg = config();
  const resourceType = resourceTypeFor(mimeType);
  const fields = {
    public_id: newPublicId(folder),
    timestamp: String(Math.floor(Date.now() / 1000))
  };
  const signature = cloudinary.utils.api_sign_request(fields, cfg.api_secret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloud_name}/${resourceType}/upload`,
    fields: { ...fields, api_key: cfg.api_key, signature },
    // Cloudinary signatures are valid for one hour.
    expiresInSeconds: 3600
  };
}

/**
 * Best-effort removal. Only Cloudinary URLs from this account are acted on;
 * anything else (old Supabase links, third-party images) is left alone.
 */
export async function deleteMediaByUrl(url: string): Promise<boolean> {
  const cfg = cloudinary.config();
  if (!cfg.cloud_name || !url) return false;

  const match = new RegExp(
    `^https://res\\.cloudinary\\.com/${cfg.cloud_name}/(image|video)/upload/(?:v\\d+/)?(.+)\\.[a-z0-9]+$`,
    "i"
  ).exec(url);
  if (!match) return false;

  try {
    const result = await cloudinary.uploader.destroy(match[2], { resource_type: match[1] as ResourceType });
    return result?.result === "ok";
  } catch (error: any) {
    logger.warn(`Could not remove media: ${error?.message || error}`);
    return false;
  }
}

/** Read-only health check for Admin → Settings. */
export async function mediaStorageStatus() {
  const cfg = cloudinary.config();
  const status = {
    provider: "cloudinary",
    bucket: ROOT_FOLDER,
    cloudName: cfg.cloud_name || null,
    configured: Boolean(cfg.cloud_name && cfg.api_key && cfg.api_secret),
    reachable: false,
    ok: false,
    error: null as string | null
  };

  if (!status.configured) {
    status.error = "Missing CLOUDINARY_URL on the API server.";
    return status;
  }

  try {
    await cloudinary.api.ping();
    status.reachable = true;
    status.ok = true;
  } catch (error: any) {
    status.error = error?.error?.message || error?.message || "Could not reach Cloudinary";
  }
  return status;
}
