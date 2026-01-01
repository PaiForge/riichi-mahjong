import type { FuResult, FuDetails } from "../types";
import { FU_BASE } from "../constants";

/**
 * 七対子の符を計算する
 */
export function calculateChiitoitsuFu(): FuResult {
  const details: FuDetails = {
    base: FU_BASE.CHIITOITSU,
    mentsu: 0,
    jantou: 0,
    machi: 0,
    agari: 0,
  };
  return {
    total: FU_BASE.CHIITOITSU,
    details,
  };
}
