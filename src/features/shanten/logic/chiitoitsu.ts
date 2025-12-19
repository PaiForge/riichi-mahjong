import { normalizeHaiIds } from "../../../core/hai";
import { countHaiKind, validateTehai13 } from "../../../core/tehai";
import type { HaiId, HaiKindId, Tehai13 } from "../../../types";

/**
 * 七対子のシャンテン数を計算する
 *
 * @param tehai 手牌 (13枚)
 * @returns シャンテン数 (0: 聴牌, -1: 和了 - 理論上)
 */
export function calculateChiitoitsuShanten<T extends HaiKindId | HaiId>(
  tehai: Tehai13<T>,
): number {
  // 防御的プログラミング (Defensive Programming):
  // 公開API（calculateShanten）側でもバリデーションが行われる想定だが（Facadeパターン）、
  // 内部整合性を保つため、ここでも独立してバリデーションを実施する。
  validateTehai13(tehai);

  // シャンテン数を計算する前にバリデーションを実行する
  // 七対子は門前のみ

  if (tehai.exposed.length > 0) {
    return Infinity;
  }

  // HaiId/HaiKindId の正規化 (src/core/hai.ts のヒューリスティックを使用)
  const normalizedClosed = normalizeHaiIds(tehai.closed);
  const haiCounts = countHaiKind(normalizedClosed);

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

  let shanten = 6 - pairs;

  // 種類不足ペナルティ
  if (kinds < 7) {
    shanten += 7 - kinds;
  }

  return shanten;
}
