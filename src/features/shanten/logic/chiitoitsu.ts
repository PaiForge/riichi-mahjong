import type { HaiId, HaiKindId, Tehai13 } from "../../../types";
import { normalizeHaiIds } from "../../../core/hai";

/**
 * 七対子（チートイツ）のシャンテン数を計算します。
 *
 * ルール:
 * - 異なる7つの対子が必要。
 * - 門前限定（副露していてはいけない）。
 * - 4枚使いは1対子としてカウントする(基本的に同種牌4枚による2対子は認められない)。
 *
 * 計算式:
 * シャンテン数 = 6 - (対子の数) + (種類不足によるペナルティ)
 *
 * *種類不足ペナルティ*:
 * 7つの異なる対子を作るためには最低7種類の牌が必要。
 * 所持している牌の種類数 (kinds) が7未満の場合、その不足分を加算する。
 * ペナルティ = max(0, 7 - kinds)
 *
 * @param tehai 手牌
 * @returns シャンテン数 (0: 聴牌, -1: 和了(理論上))。副露している場合は Infinity。
 */
export function calculateChiitoitsuShanten<T extends HaiKindId | HaiId>(
  tehai: Tehai13<T>,
): number {
  // 七対子は門前のみ
  if (tehai.exposed.length > 0) {
    return Infinity;
  }

  // HaiId/HaiKindId の正規化 (src/core/hai.ts のヒューリスティックを使用)
  const normalizedClosed = normalizeHaiIds(tehai.closed);

  const counts = new Map<number, number>();
  for (const kind of normalizedClosed) {
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  let pairs = 0;
  let kinds = 0;

  for (const count of counts.values()) {
    kinds++;
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
