import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { KAZEHAI_KIND_IDS } from "../../../../core/hai";
import { countSpecificKoutsu } from "../helpers";

// 大四喜の条件: 風牌の刻子が4つ全てあること
const checkDaisuushii = (hand: HouraStructure): boolean =>
  countSpecificKoutsu(hand, KAZEHAI_KIND_IDS) === 4;

/**
 * 大四喜。風牌4種すべての刻子で成立する役満。
 *
 * ダブル役満（26翻）とするかはルールで割れるため、ルール設定
 * （`yakumanRuleConfig.daisuushii`）が有効な場合のみ26翻とする。
 * 既定は無効（13翻）。副露していても成立し翻数は変わらない。
 */
export const daisuushiiDefinition: YakuDefinition = createYaku("Daisuushii", {
  open: 13,
  closed: 13,
})
  .require(checkDaisuushii)
  .dynamicHan((_hand, context) =>
    context.yakumanRuleConfig?.daisuushii === true ? 26 : 13,
  )
  .build();
