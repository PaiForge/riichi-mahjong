import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HaiKind, type HaiKindId } from "../../../../types";

const SHOUSANGEN_YAKU: Yaku = {
  name: "Shousangen",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

import { countSpecificKoutsu } from "../helpers";

const checkShousangen = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const sangenpai: HaiKindId[] = [HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun];
  const sangenKoutsuCount = countSpecificKoutsu(hand, sangenpai);

  // 2. 三元牌の雀頭があるかチェック
  const isSangenJantou = sangenpai.includes(hand.jantou.hais[0]);

  // 小三元の条件: 三元牌の刻子が2つ かつ 三元牌の雀頭が1つ
  return sangenKoutsuCount === 2 && isSangenJantou;
};

export const shousangenDefinition: YakuDefinition = createYakuDefinition(
  SHOUSANGEN_YAKU,
  checkShousangen,
);
