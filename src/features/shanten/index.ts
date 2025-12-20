import type { HaiId, HaiKindId, Tehai13 } from "../../types";
import { validateTehai13 } from "../../core/tehai";
import { calculateChiitoitsuShanten } from "./logic/chiitoitsu";
import { calculateKokushiShanten } from "./logic/kokushi";
import { calculateMentsuShanten } from "./logic/mentsu";

/**
 * シャンテン数を計算します。
 * 面子手、七対子、国士無双のシャンテン数のうち最小値を返します。
 *
 * @param tehai 手牌
 * @returns シャンテン数
 */
export function calculateShanten<T extends HaiKindId | HaiId>(
  tehai: Tehai13<T>,
  useChiitoitsu = true,
  useKokushi = true,
): number {
  // Facadeパターン: 公開APIのエントリーポイントで入力を保証する
  validateTehai13(tehai);

  const chiitoitsuShanten = useChiitoitsu
    ? calculateChiitoitsuShanten(tehai)
    : Infinity;
  const kokushiShanten = useKokushi ? calculateKokushiShanten(tehai) : Infinity;
  const mentsuShanten = calculateMentsuShanten(tehai);

  return Math.min(chiitoitsuShanten, kokushiShanten, mentsuShanten);
}
