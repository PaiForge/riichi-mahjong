import type { HaiKindId, Tehai13 } from "../../types";
import { countHaiKind } from "../../core/hai-count";
import { calculateMentsuTeShanten } from "../shanten";
import { asHaiKindId } from "../../utils/assertions";

/**
 * 手牌の受け入れ（有効牌）を計算する。
 * 今回は面子手のみを対象とし、七対子や国士無双は考慮しない。
 *
 * @param tehai 手牌 (13枚)
 * @returns シャンテン数を進める牌のリスト
 */
export function getUkeire(tehai: Tehai13): HaiKindId[] {
  const currentShanten = calculateMentsuTeShanten(tehai);

  // 手牌の全ての牌（純手牌 + 副露）をカウント
  const allHais: HaiKindId[] = [
    ...tehai.closed,
    ...tehai.exposed.flatMap((m) => m.hais),
  ];
  const haiCounts = countHaiKind(allHais);

  // 全34種の牌について、1枚加えてシャンテン数が下がるか試す
  return Array.from({ length: 34 }, (_, i) => asHaiKindId(i)).filter((tile) => {
    // 4枚使い切っている牌種はスキップ（山に残っていない）
    if (haiCounts[tile] >= 4) {
      return false;
    }

    // 14枚になるため Tehai13 の枠を外れるが、calculateMentsuTeShanten は
    // 汎用の Tehai を受け付けるため構造的に適合する。
    const trialTehai = {
      closed: [...tehai.closed, tile],
      exposed: tehai.exposed,
    };

    return calculateMentsuTeShanten(trialTehai) < currentShanten;
  });
}
