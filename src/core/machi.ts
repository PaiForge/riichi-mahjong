import type { HouraStructure, HaiKindId, MachiType, Shuntsu } from "../types";

/**
 * 手牌構造と和了牌から待ちの形を判定する
 * @param hand 分解された手牌構造
 * @param agariHai 和了牌
 * @returns 待ちの形（判定できない、または Shanpon などの場合は undefined）
 */
export function classifyMachi(
  hand: HouraStructure,
  agariHai: HaiKindId,
): MachiType | undefined {
  // 1. 雀頭での和了（単騎待ち）
  if (hand.jantou.hais.includes(agariHai)) {
    return "Tanki";
  }

  // 2. 順子・刻子・槓子での和了
  for (const mentsu of hand.fourMentsu) {
    if (mentsu.type === "Shuntsu") {
      const machi = classifyShuntsuWait(mentsu, agariHai);
      if (machi) return machi;
    } else {
      // 3. 刻子・槓子での和了（双碰待ち）
      // 刻子の一部が和了牌＝シャボ待ちで和了
      if (mentsu.hais.includes(agariHai)) {
        return "Shanpon";
      }
    }
  }

  return undefined;
}

/**
 * 順子における待ちの形を判定する（内部ヘルパー）
 */
function classifyShuntsuWait(
  shuntsu: Shuntsu,
  agariHai: HaiKindId,
): MachiType | undefined {
  const { hais } = shuntsu;
  if (!hais.includes(agariHai)) return undefined;

  const [a, b, c] = hais; // 順子はソートされている前提

  if (agariHai === a) {
    // [Agari, b, c]
    const valC = c % 9;
    if (valC === 8) return "Penchan";
    return "Ryanmen";
  }

  if (agariHai === c) {
    // [a, b, Agari]
    const valA = a % 9;
    if (valA === 0) return "Penchan";
    return "Ryanmen";
  }

  if (agariHai === b) {
    // [a, Agari, c]
    return "Kanchan";
  }

  return undefined;
}
