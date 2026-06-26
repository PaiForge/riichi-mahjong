import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HaiKind, type HaiKindId } from "../../../../types";
import { countSpecificKoutsu } from "../helpers";

const checkDaisuushii = (hand: HouraStructure): boolean => {
  const windTiles: HaiKindId[] = [
    HaiKind.Ton,
    HaiKind.Nan,
    HaiKind.Sha,
    HaiKind.Pei,
  ];

  const windKoutsuCount = countSpecificKoutsu(hand, windTiles);

  // 大四喜の条件: 風牌の刻子が4つ全てあること
  return windKoutsuCount === 4;
};

// TODO: ダブル役満（26翻）とするかはルールによるため、一旦通常の役満として実装
export const daisuushiiDefinition: YakuDefinition = createYaku("Daisuushii", {
  open: 13,
  closed: 13,
})
  .require(checkDaisuushii)
  .build();
