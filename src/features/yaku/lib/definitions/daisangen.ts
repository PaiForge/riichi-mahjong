import { createYakuDefinition } from "../../factory";
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

export const daisangenDefinition: YakuDefinition = createYakuDefinition(
  DAISANGEN_YAKU,
  checkDaisangen,
);
