import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { SANGENPAI_KIND_IDS } from "../../../../core/hai";
import { countSpecificKoutsu } from "../helpers";

// 大三元の条件: 三元牌の刻子が3つ全てあること
const checkDaisangen = (hand: HouraStructure): boolean =>
  countSpecificKoutsu(hand, SANGENPAI_KIND_IDS) === 3;

export const daisangenDefinition: YakuDefinition = createYaku("Daisangen", {
  open: 13,
  closed: 13,
})
  .require(checkDaisangen)
  .build();
