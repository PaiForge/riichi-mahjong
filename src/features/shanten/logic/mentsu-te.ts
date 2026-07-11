import type { Tehai } from "../../../types";

import { canStartShuntsuAt, countHaiKind } from "../../../core/hai-count";

/**
 * 面子手（4面子1雀頭）のシャンテン数を計算する
 *
 * 入力の妥当性検証は公開API（calculateShanten）側で行う。
 *
 * @param tehai 手牌 (13枚 or 14枚)
 * @returns シャンテン数
 */
export function calculateMentsuTeShanten(tehai: Tehai): number {
  // アルゴリズム上ミューテーションが必要なため、可変の number 配列に複製する
  const counts: number[] = Array.from(countHaiKind(tehai.closed));
  const exposedCount = tehai.exposed.length;

  // 面子数 m・塔子数 t・雀頭の有無からシャンテン数を算出する標準式
  const shantenOf = (m: number, t: number, hasJantou: boolean): number => {
    const mentsuCount = exposedCount + m;
    const effectiveTaatsu = Math.min(4 - mentsuCount, t);
    return 8 - 2 * mentsuCount - effectiveTaatsu - (hasJantou ? 1 : 0);
  };

  // 1. 雀頭を固定しない場合
  const noJantou = searchMentsu(counts);
  let minShanten = shantenOf(noJantou.m, noJantou.t, false);

  // 2. 各牌種を雀頭として抜き出した場合
  for (let i = 0; i < 34; i++) {
    if ((counts[i] ?? 0) < 2) continue;

    counts[i] = (counts[i] ?? 0) - 2;
    const withJantou = searchMentsu(counts);
    minShanten = Math.min(
      minShanten,
      shantenOf(withJantou.m, withJantou.t, true),
    );
    counts[i] = (counts[i] ?? 0) + 2;
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
  // バックトラックでミューテーションするため複製する
  const w = [...counts];
  const get = (i: number): number => w[i] ?? 0;
  const add = (i: number, delta: number): void => {
    w[i] = get(i) + delta;
  };

  const search = (index: number, m: number): void => {
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
    if (get(index) === 0) {
      search(index + 1, m);
      return;
    }

    // A. 刻子 (3枚) の場合
    if (get(index) >= 3) {
      add(index, -3);
      search(index, m + 1);
      add(index, 3);
    }

    // B. 順子 (3枚) の場合
    if (
      canStartShuntsuAt(index) &&
      get(index) > 0 &&
      get(index + 1) > 0 &&
      get(index + 2) > 0
    ) {
      add(index, -1);
      add(index + 1, -1);
      add(index + 2, -1);
      search(index, m + 1);
      add(index, 1);
      add(index + 1, 1);
      add(index + 2, 1);
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
  // ミューテーションするため複製する
  const w = [...counts];
  const get = (i: number): number => w[i] ?? 0;
  const take = (...indices: readonly number[]): void => {
    for (const i of indices) w[i] = get(i) - 1;
  };

  for (let i = 0; i < 34; i++) {
    if (get(i) === 0) continue;

    // 順子系の塔子 (1枚 + 1枚)
    if (i < 27) {
      const mod = i % 9;
      // 辺張・両面 (i, i+1)
      if (mod < 8 && get(i) > 0 && get(i + 1) > 0) {
        take(i, i + 1);
        taatsu++;
      }

      // 嵌張 (i, i+2)
      if (mod < 7 && get(i) > 0 && get(i + 2) > 0) {
        take(i, i + 2);
        taatsu++;
      }
    }

    // 対子 (2枚)
    if (get(i) >= 2) {
      take(i, i);
      taatsu++;
    }
  }
  return taatsu;
}
