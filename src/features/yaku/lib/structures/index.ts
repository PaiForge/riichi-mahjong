import type { Tehai14 } from "../../../../types";
import type { HouraDecomposition } from "../../../../types";
import { getHouraStructuresForMentsuTe } from "./mentsu-te";
import { getHouraStructuresForChiitoitsu } from "./chiitoitsu";
import { getHouraStructuresForKokushi } from "./kokushi";

export * from "./mentsu-te";
export * from "./chiitoitsu";
export * from "./kokushi";

/**
 * 手牌をすべての可能な和了形に分解する。
 * 面子手、七対子、国士無双の全ての可能性を探索する。
 *
 * 面子手は和了牌の置き場所が未確定の分解（{@link MentsuDecomposition}）で
 * 返す。和了構造として役・符の判定に渡すには、和了牌で置き場所を展開すること
 * （`expandAgariPlacements`）。
 */
export function getHouraStructures(tehai: Tehai14): HouraDecomposition[] {
  return [
    ...getHouraStructuresForMentsuTe(tehai),
    ...getHouraStructuresForChiitoitsu(tehai),
    ...getHouraStructuresForKokushi(tehai),
  ];
}
