import type { FuResult, FuDetails } from "../types";
import { FU_BASE } from "../constants";

/**
 * 国士無双の符を計算する
 * (点数計算上は役満固定だが、便宜上符底のみを返す)
 */
export function calculateKokushiFu(): FuResult {
  const details: FuDetails = {
    base: FU_BASE.KOKUSHI,
    mentsu: 0,
    jantou: 0,
    machi: 0,
    agari: 0,
  };
  return {
    total: FU_BASE.KOKUSHI,
    details,
  };
}
