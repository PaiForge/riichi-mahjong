import type { Tehai14, HouraStructure } from "../../../../types";
import { getHouraStructuresForMentsuTe } from "./mentsu-te";
import { getHouraStructuresForChiitoitsu } from "./chiitoitsu";
import { getHouraStructuresForKokushi } from "./kokushi";

export * from "./mentsu-te";
export * from "./chiitoitsu";
export * from "./kokushi";

/**
 * 手牌をすべての可能な和了形に構造化する。
 * 面子手、七対子、国士無双の全ての可能性を探索する。
 */
export function getHouraStructures(tehai: Tehai14): HouraStructure[] {
  return [
    ...getHouraStructuresForMentsuTe(tehai),
    ...getHouraStructuresForChiitoitsu(tehai),
    ...getHouraStructuresForKokushi(tehai),
  ];
}
