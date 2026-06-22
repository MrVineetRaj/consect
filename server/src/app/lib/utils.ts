import crypto from "crypto";
export function generateBase64String(length = 32) {
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64")
    .slice(0, length);
}
