import type { HaiKindId, Shuntsu, HouraStructure } from "../types";
import { haiKindToNumber } from "./hai";

/** 待ちの形 */
export type MachiType =
  | "Tanki" // 単騎待ち
  | "Shanpon" // 双碰待ち (シャボ)
  | "Ryanmen" // 両面待ち
  | "Kanchan" // 嵌張待ち
  | "Penchan"; // 辺張待ち

/**
 * 和了構造から待ちの形を判定する (classifyMachi)
 *
 * 待ちは和了牌の置き場所（{@link MentsuHouraStructure.agari}）で決まる。
 * 雀頭なら単騎、刻子なら双碰、順子なら和了牌の位置で両面・嵌張・辺張。
 * 置き場所が複数ある手でどれを採るかは高点法の問題であり、この関数は
 * 与えられた和了構造の置き場所をそのまま読む。
 *
 * @param hand 和了構造
 * @returns 待ちの形。面子手でない（七対子・国士無双）場合は undefined
 */
export function classifyMachi(hand: HouraStructure): MachiType | undefined {
  if (hand.type !== "Mentsu") return undefined;

  const { agari } = hand;
  if (agari.kind === "Jantou") return "Tanki";

  const mentsu = hand.fourMentsu[agari.index];
  return mentsu.type === "Shuntsu"
    ? classifyShuntsuWait(mentsu, agari.hai)
    : "Shanpon";
}

/**
 * 順子における待ちの形を判定する（内部ヘルパー）
 */
function classifyShuntsuWait(
  shuntsu: Shuntsu,
  agariHai: HaiKindId,
): MachiType | undefined {
  const [a, b, c] = shuntsu.hais; // 順子はソートされている前提

  if (agariHai === a) {
    // [Agari, b, c]: 789 の 7 待ちのみ辺張、それ以外は両面
    return haiKindToNumber(c) === 9 ? "Penchan" : "Ryanmen";
  }

  if (agariHai === c) {
    // [a, b, Agari]: 123 の 3 待ちのみ辺張、それ以外は両面
    return haiKindToNumber(a) === 1 ? "Penchan" : "Ryanmen";
  }

  if (agariHai === b) {
    // [a, Agari, c]
    return "Kanchan";
  }

  return undefined;
}
