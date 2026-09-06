import type { Tehai13 } from "../../types";
import { validateTehai13, TehaiError } from "../../core/tehai";
import type { Result } from "neverthrow";
import { calculateChiitoitsuShanten } from "./logic/chiitoitsu";
import { calculateKokushiShanten } from "./logic/kokushi";
import { calculateMentsuTeShanten } from "./logic/mentsu-te";

export {
  calculateChiitoitsuShanten,
  calculateKokushiShanten,
  calculateMentsuTeShanten,
};

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
): Result<number, TehaiError> {
  // Facadeパターン: 公開APIのエントリーポイントで入力を保証する
  return validateTehai13(tehai).map((validated) => {
    const chiitoitsuShanten = useChiitoitsu
      ? calculateChiitoitsuShanten(validated)
      : Infinity;
    const kokushiShanten = useKokushi
      ? calculateKokushiShanten(validated)
      : Infinity;
    const mentsuShanten = calculateMentsuTeShanten(validated);

    return Math.min(chiitoitsuShanten, kokushiShanten, mentsuShanten);
  });
}
