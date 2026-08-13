// JSON 出力 (schemaVersion 付き)
import type { JsonEnvelope } from "../models/types";

export const SCHEMA_VERSION = "1.0";

export function outputJson<T>(data: T): void {
  const envelope: JsonEnvelope<T> = {
    schemaVersion: SCHEMA_VERSION,
    data,
  };
  console.log(JSON.stringify(envelope, null, 2));
}
