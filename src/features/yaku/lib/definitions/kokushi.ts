import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkKokushi = (hand: HouraStructure): boolean => {
  return hand.type === "Kokushi";
};

/**
 * 国士無双。13種の么九牌で成立する役満。
 *
 * 十三面待ち（和了牌が雀頭になる形。和了前の13枚が么九牌13種ちょうど）の
 * 場合、ルール設定（`yakumanRuleConfig.kokushiMusouJuusanmen`）が有効なら
 * ダブル役満（26翻）として扱う。既定は無効（13翻）。
 * 単騎待ち（雀頭が既にあり欠けた1種を待つ形）は常に13翻。
 */
export const kokushiDefinition: YakuDefinition = createYaku("KokushiMusou", {
  open: 0,
  closed: 13,
})
  .require(checkKokushi)
  .dynamicHan((hand, context) => {
    // 雀頭＝和了牌なら、和了前の13枚は么九牌13種ちょうど（十三面待ち）
    const isJuusanmen =
      hand.type === "Kokushi" && hand.jantou === context.agariHai;
    return isJuusanmen &&
      context.yakumanRuleConfig?.kokushiMusouJuusanmen === true
      ? 26
      : 13;
  })
  .build();
