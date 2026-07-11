import { countHaiKind } from "../../../core/hai-count";
import type { Tehai13 } from "../../../types";

/**
 * 七対子のシャンテン数を計算する
 *
 * 入力の妥当性検証は公開API（calculateShanten）側で行う。
 *
 * @param tehai 手牌 (13枚)
 * @returns シャンテン数 (0: 聴牌)。副露している場合は Infinity。
 */
export function calculateChiitoitsuShanten(tehai: Tehai13): number {
  // 七対子は門前のみ
  if (tehai.exposed.length > 0) {
    return Infinity;
  }

  const haiCounts = countHaiKind(tehai.closed);

  let pairs = 0;
  let kinds = 0;

  for (const count of haiCounts) {
    if (count > 0) {
      kinds++;
    }
    if (count >= 2) {
      pairs++;
    }
  }

  // 基本式: 6 - 対子数。同種3枚以上は1対子としか数えられないため、
  // 牌の種類が7未満の場合は不足分をペナルティとして加算する。
  const kindShortage = Math.max(0, 7 - kinds);
  return 6 - pairs + kindShortage;
}
