import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HaiKind, type HaiKindId } from "../../../../types";

const DAISUUSHII_YAKU: Yaku = {
  name: "Daisuushii",
  han: {
    // TODO: ダブル役満（26翻）とするかはルールによるため、一旦通常の役満として実装
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

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

export const daisuushiiDefinition: YakuDefinition = createYaku(
  DAISUUSHII_YAKU.name,
  DAISUUSHII_YAKU.han.closed,
  typeof DAISUUSHII_YAKU.han.open === "number" ? DAISUUSHII_YAKU.han.open : 0,
)
  .require(checkDaisuushii)
  .build();
