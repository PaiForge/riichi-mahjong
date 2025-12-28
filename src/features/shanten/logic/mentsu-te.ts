import type { Tehai13 } from "../../../types";

import { countHaiKind, validateTehai13 } from "../../../core/tehai";

/**
 * 面子手（4面子1雀頭）のシャンテン数を計算する
 *
 * @param tehai 手牌 (13枚)
 * @returns シャンテン数
 */
export function calculateMentsuTeShanten(tehai: Tehai13): number {
  // 防御的プログラミング
  validateTehai13(tehai);

  const counts = countHaiKind(tehai.closed);
  // Mutation is required for the algorithm, so we convert to a mutable number array
  const mutableCounts: number[] = Array.from(counts);
  const exposedCount = tehai.exposed.length;

  // 基本シャンテン数 (8 - 2 * 面子数)
  let minShanten = 8 - 2 * exposedCount;

  // 1. 雀頭がある場合
  for (let i = 0; i < 34; i++) {
    if ((mutableCounts[i] ?? 0) >= 2) {
      mutableCounts[i] = (mutableCounts[i] ?? 0) - 2;
      const { m, t } = searchMentsu(mutableCounts);
      const currentMentsu = exposedCount + m;
      const effectiveTaatsu = Math.min(4 - currentMentsu, t);
      const shanten = 8 - 2 * currentMentsu - effectiveTaatsu - 1;
      minShanten = Math.min(minShanten, shanten);
      mutableCounts[i] = (mutableCounts[i] ?? 0) + 2;
    }
  }

  // 2. 雀頭がない場合
  {
    const { m, t } = searchMentsu(mutableCounts);
    const currentMentsu = exposedCount + m;
    const effectiveTaatsu = Math.min(4 - currentMentsu, t);
    const shanten = 8 - 2 * currentMentsu - effectiveTaatsu;
    minShanten = Math.min(minShanten, shanten);
  }

  return minShanten;
}

/**
 * 探索結果の型
 */
interface SearchResult {
  m: number;
  t: number;
}

/**
 * 面子と塔子の最大数を探索する
 */
function searchMentsu(counts: readonly number[]): SearchResult {
  let maxScore = -1;
  let bestResult: SearchResult = { m: 0, t: 0 };
  // copies needed because we mutate counts
  const w = [...counts];

  const search = (index: number, m: number) => {
    // 34種類すべて見終わったら塔子を数える
    if (index >= 34) {
      const t = countTaatsu(w);
      const score = 2 * m + t;
      if (score > maxScore) {
        maxScore = score;
        bestResult = { m, t };
      }
      return;
    }

    // 牌がない場合は次に進む
    if ((w[index] ?? 0) === 0) {
      search(index + 1, m);
      return;
    }

    // A. 刻子 (3枚) の場合
    if ((w[index] ?? 0) >= 3) {
      w[index] = (w[index] ?? 0) - 3;
      search(index, m + 1);
      w[index] = (w[index] ?? 0) + 3;
    }

    // B. 順子 (3枚) の場合
    if (index < 27) {
      const mod = index % 9;
      if (mod < 7) {
        if (
          (w[index] ?? 0) > 0 &&
          (w[index + 1] ?? 0) > 0 &&
          (w[index + 2] ?? 0) > 0
        ) {
          w[index] = (w[index] ?? 0) - 1;
          w[index + 1] = (w[index + 1] ?? 0) - 1;
          w[index + 2] = (w[index + 2] ?? 0) - 1;
          search(index, m + 1);
          w[index] = (w[index] ?? 0) + 1;
          w[index + 1] = (w[index + 1] ?? 0) + 1;
          w[index + 2] = (w[index + 2] ?? 0) + 1;
        }
      }
    }

    // C. 面子として使わない場合
    search(index + 1, m);
  };

  search(0, 0);
  return bestResult;
}

/**
 * 残った牌から塔子（対子、両面、嵌張、辺張）の数を数える
 */
function countTaatsu(counts: readonly number[]): number {
  let taatsu = 0;
  // countsのコピーを作成
  const w = [...counts];

  for (let i = 0; i < 34; i++) {
    if ((w[i] ?? 0) === 0) continue;

    // 順子系の塔子 (1枚 + 1枚)
    if (i < 27) {
      const mod = i % 9;
      // 辺張・両面 (i, i+1)
      if (mod < 8) {
        if ((w[i] ?? 0) > 0 && (w[i + 1] ?? 0) > 0) {
          w[i] = (w[i] ?? 0) - 1;
          w[i + 1] = (w[i + 1] ?? 0) - 1;
          taatsu++;
        }
      }

      // 嵌張 (i, i+2)
      if (mod < 7) {
        if ((w[i] ?? 0) > 0 && (w[i + 2] ?? 0) > 0) {
          w[i] = (w[i] ?? 0) - 1;
          w[i + 2] = (w[i + 2] ?? 0) - 1;
          taatsu++;
        }
      }
    }

    // 対子 (2枚)
    if ((w[i] ?? 0) >= 2) {
      w[i] = (w[i] ?? 0) - 2;
      taatsu++;
    }
  }
  return taatsu;
}
