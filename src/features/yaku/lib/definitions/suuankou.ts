import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HouraContext } from "../../types";
import { countAnkou } from "../helpers";

const checkSuuankou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  return countAnkou(hand, context) === 4;
};

/**
 * 四暗刻。暗刻4つで成立する役満。
 * 雀頭が和了牌（単騎待ち）の場合はダブル役満（26翻）として扱う。
 *
 * 翻数が和了形（単騎か否か）で変動するため、dynamicHan で翻数を算出する。
 * 暗刻4つは構造上必ず門前となるため open は 0（不成立）。
 */
export const suuankouDefinition: YakuDefinition = createYaku("Suuankou", {
  open: 0,
  closed: 13,
})
  .require(checkSuuankou)
  .dynamicHan((hand, context) => {
    const isTanki =
      hand.type === "Mentsu" && hand.jantou.hais[0] === context.agariHai;
    return isTanki ? 26 : 13;
  })
  .build();
