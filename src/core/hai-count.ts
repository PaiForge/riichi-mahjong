import type { HaiKindId, HaiKindDistribution } from "../types";

/**
 * 牌種ごとの枚数をカウントします。
 *
 * 牌種ID(0-33)をインデックスとする長さ34の枚数分布を返します。
 * シャンテン計算・構造化・受け入れ判定など、牌姿を数値分布として扱う
 * 各種アルゴリズムの基礎となるユーティリティです。
 */
export function countHaiKind(hais: readonly HaiKindId[]): HaiKindDistribution {
  const counts = Array.from({ length: 34 }, () => 0);
  for (const hai of hais) {
    counts[hai] = (counts[hai] ?? 0) + 1;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return counts as unknown as HaiKindDistribution;
}

/**
 * 牌種ID（＝カウント分布のインデックス）が順子の開始位置になり得るか判定する。
 *
 * すなわち index, index+1, index+2 が同一の数牌スートに収まる位置か
 * （数牌かつ 1〜7、0-based では index < 27 かつ index % 9 <= 6）。
 * 順子の抜き取りや嵌張（index, index+2）の開始可否判定に用いる、
 * シャンテン計算・面子分解で共通のドメイン境界。
 */
export function canStartShuntsuAt(index: number): boolean {
  return index < 27 && index % 9 <= 6;
}
