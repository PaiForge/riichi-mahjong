import type { Tehai13 } from "../../../types";
import { YAOCHU_KIND_IDS } from "../../../core/hai";
import { countHaiKind } from "../../../core/hai-count";

/**
 * 国士無双のシャンテン数を計算します。
 *
 * ルール:
 * - 13種類の么九牌（1,9,字牌）を各1枚ずつ揃える。
 * - そのうちのどれか1種類が対子（2枚）になっている必要がある。
 * - 門前限定。
 *
 * 計算式:
 * シャンテン数 = 13 - (么九牌の種類数) - (么九牌の対子があるか ? 1 : 0)
 *
 * 入力の妥当性検証は公開API（calculateShanten）側で行う。
 *
 * @param tehai 手牌
 * @returns シャンテン数 (0: 聴牌)。副露している場合は Infinity。
 */
export function calculateKokushiShanten(tehai: Tehai13): number {
  // 国士無双は門前のみ
  if (tehai.exposed.length > 0) {
    return Infinity;
  }

  const dist = countHaiKind(tehai.closed);

  const uniqueYaochuCount = YAOCHU_KIND_IDS.filter(
    (kind) => dist[kind] > 0,
  ).length;
  const hasYaochuPair = YAOCHU_KIND_IDS.some((kind) => dist[kind] >= 2);

  const pairBonus = hasYaochuPair ? 1 : 0;
  return 13 - uniqueYaochuCount - pairBonus;
}
