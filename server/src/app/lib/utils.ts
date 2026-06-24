import crypto from "crypto";
export function generateBase64String(length = 32) {
  // base64url (not base64) so ids are URL-safe: it uses "-"/"_" instead of
  // "+"/"/" and has no "=" padding. Standard base64 ids break route paths
  // because the "/" is parsed as an extra segment.
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64url")
    .slice(0, length);
}
