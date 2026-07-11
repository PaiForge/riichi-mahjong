import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { KAZEHAI_KIND_IDS } from "../../../../core/hai";
import { countSpecificKoutsu } from "../helpers";

// 大四喜の条件: 風牌の刻子が4つ全てあること
const checkDaisuushii = (hand: HouraStructure): boolean =>
  countSpecificKoutsu(hand, KAZEHAI_KIND_IDS) === 4;

// TODO: ダブル役満（26翻）とするかはルールによるため、一旦通常の役満として実装
export const daisuushiiDefinition: YakuDefinition = createYaku("Daisuushii", {
  open: 13,
  closed: 13,
})
  .require(checkDaisuushii)
  .build();
