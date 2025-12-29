import type { YakuHanConfig, YakuName, HouraStructure } from "./types";
import { YakuDefinition, HouraContext } from "./types";

/**
 * 役定義を作成するファクトリ関数
 *
 * @param yaku 役の設定情報（名前、飜数など）
 * @param check 役の成立条件を判定する関数 (真偽値を返す)
 * @returns YakuDefinition (isSatisfied, getHansu を持つ)
 */
export function createYakuDefinition(
  yaku: Readonly<{ name: YakuName; han: YakuHanConfig }>,
  check: (hand: HouraStructure, context: HouraContext) => boolean,
): YakuDefinition {
  return {
    yaku,
    isSatisfied: check,
    getHansu: (hand, context) => {
      if (!check(hand, context)) {
        return 0;
      }
      return context.isMenzen ? yaku.han.closed : yaku.han.open;
    },
  };
}
