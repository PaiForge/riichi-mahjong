import type { HouraStructure } from "../../../../types";
import type { HouraContext } from "../../../yaku/types";
import type { FuResult, FuRuleConfig } from "./types";
import { FU_BASE } from "./constants";
import { createFixedFuResult } from "./lib/fixed";
import { calculateMentsuFu } from "./lib/mentsu";

/**
 * 手牌の符を計算する (calculateFu)
 *
 * @param hand 和了形の手牌構造
 * @param context 和了コンテキスト (場風、自風、ツモ/ロン等)
 * @param isPinfu 平和が成立しているかどうか (平和ツモ20符例外の適用に必要)
 * @param ruleConfig 符計算のルール差分設定（任意）
 * @returns 符計算結果
 */
export function calculateFu(
  hand: HouraStructure,
  context: HouraContext,
  isPinfu = false,
  ruleConfig?: FuRuleConfig,
): FuResult {
  // 1. 七対子 (ChiiToitsu)
  if (hand.type === "Chiitoitsu") {
    return createFixedFuResult(FU_BASE.CHIITOITSU);
  }

  // 2. 国士無双 (Kokushi)
  if (hand.type === "Kokushi") {
    return createFixedFuResult(FU_BASE.KOKUSHI);
  }

  // 3. 面子手 (Mentsu)
  return calculateMentsuFu(hand, context, isPinfu, ruleConfig);
}
