import type { HouraStructure, HouraContext } from "../../../yaku/types";
import type { FuResult } from "./types";
import { calculateChiitoitsuFu } from "./lib/chiitoitsu";
import { calculateKokushiFu } from "./lib/kokushi";
import { calculateMentsuFu } from "./lib/mentsu";

/**
 * 手牌の符を計算する (calculateFu)
 *
 * @param hand 和了形の手牌構造
 * @param context 和了コンテキスト (場風、自風、ツモ/ロン等)
 * @param isPinfu 平和が成立しているかどうか (平和ツモ20符例外の適用に必要)
 * @returns 符計算結果
 */
export function calculateFu(
  hand: HouraStructure,
  context: HouraContext,
  isPinfu = false,
): FuResult {
  // 1. 七対子 (ChiiToitsu)
  if (hand.type === "Chiitoitsu") {
    return calculateChiitoitsuFu();
  }

  // 2. 国士無双 (Kokushi)
  if (hand.type === "Kokushi") {
    return calculateKokushiFu();
  }

  // 3. 面子手 (Mentsu)
  return calculateMentsuFu(hand, context, isPinfu);
}
