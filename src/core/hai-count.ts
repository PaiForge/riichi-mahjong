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
