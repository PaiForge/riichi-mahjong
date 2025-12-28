import type { Tehai13 } from "../../types";
import { validateTehai13 } from "../../core/tehai";
import { calculateChiitoitsuShanten } from "./logic/chiitoitsu";
import { calculateKokushiShanten } from "./logic/kokushi";
import { calculateMentsuTeShanten } from "./logic/mentsu-te";

/**
 * シャンテン数を計算します。
 * 面子手、七対子、国士無双のシャンテン数のうち最小値を返します。
 *
 * NOTE: 入力は必ず牌種ID (`HaiKindId`) である必要があります。
 * 物理牌ID (`HaiId`) を持っている場合は、事前に `haiIdToKindId` で変換してください。
 *
 * @param tehai 手牌
 * @returns シャンテン数
 */
export function calculateShanten(
  tehai: Tehai13,
  useChiitoitsu = true,
  useKokushi = true,
): number {
  // Facadeパターン: 公開APIのエントリーポイントで入力を保証する
  validateTehai13(tehai);

  const chiitoitsuShanten = useChiitoitsu
    ? calculateChiitoitsuShanten(tehai)
    : Infinity;
  const kokushiShanten = useKokushi ? calculateKokushiShanten(tehai) : Infinity;
  const mentsuShanten = calculateMentsuTeShanten(tehai);

  return Math.min(chiitoitsuShanten, kokushiShanten, mentsuShanten);
}
