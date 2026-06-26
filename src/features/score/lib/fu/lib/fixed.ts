import type { FuResult, FuDetails } from "../types";

/**
 * 符底のみで確定する固定符の結果を生成する。
 * 七対子（25符）・国士無双（便宜上20符）など、面子符等の加算が無い和了形に使用。
 */
export function createFixedFuResult(base: FuDetails["base"]): FuResult {
  const details: FuDetails = {
    base,
    mentsu: 0,
    jantou: 0,
    machi: 0,
    agari: 0,
  };
  return {
    total: base,
    details,
  };
}
