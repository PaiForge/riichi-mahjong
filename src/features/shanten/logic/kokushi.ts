import type { Tehai13 } from "../../../types";
import { isYaochu } from "../../../core/hai";
import { countHaiKind, validateTehai13 } from "../../../core/tehai";
import { asHaiKindId } from "../../../utils/assertions";

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
 * @param tehai 手牌
 * @returns シャンテン数 (0: 聴牌, -1: 和了(理論上))。副露している場合は Infinity。
 */
export function calculateKokushiShanten(tehai: Tehai13): number {
  // 防御的プログラミング (Defensive Programming):
  // 公開API（calculateShanten）側でもバリデーションが行われる想定だが（Facadeパターン）、
  // 内部整合性を保つため、ここでも独立してバリデーションを実施する。
  validateTehai13(tehai);

  // 国士無双は門前のみ
  if (tehai.exposed.length > 0) {
    return Infinity;
  }

  const dist = countHaiKind(tehai.closed);

  // 么九牌の種類数をカウント
  // 同時に、么九牌の対子が存在するかもチェック
  let uniqueYaochuCount = 0;
  let hasYaochuPair = false;

  for (let i = 0; i < dist.length; i++) {
    const kind = asHaiKindId(i);
    if (!isYaochu(kind)) {
      continue;
    }

    const count = dist[i];
    if (count !== undefined && count > 0) {
      uniqueYaochuCount++;
      if (count >= 2) {
        hasYaochuPair = true;
      }
    }
  }

  const pairBonus = hasYaochuPair ? 1 : 0;

  // シャンテン数 = 13 - (種類の数) - (対子ボーナス)
  return 13 - uniqueYaochuCount - pairBonus;
}
