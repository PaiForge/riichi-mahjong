import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HaiKind, type HaiKindId } from "../../../../types";

const DAISANGEN_YAKU: Yaku = {
  name: "Daisangen",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

import { countSpecificKoutsu } from "../helpers";

const checkDaisangen = (hand: HouraStructure): boolean => {
  const sangenpai: HaiKindId[] = [HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun];
  const sangenKoutsuCount = countSpecificKoutsu(hand, sangenpai);

  // 大三元の条件: 三元牌の刻子が3つ全てあること
  return sangenKoutsuCount === 3;
};

export const daisangenDefinition: YakuDefinition = createYaku(
  DAISANGEN_YAKU.name,
  DAISANGEN_YAKU.han.closed,
  typeof DAISANGEN_YAKU.han.open === "number" ? DAISANGEN_YAKU.han.open : 0,
)
  .require(checkDaisangen)
  .build();
