import { createHash } from "crypto";

export function hashStr(str: string): string {
  return createHash("md5").update(str).digest("hex");
}
