import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Kantsu,
  Koutsu,
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

const checkDaisangen = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const sangenpai: HaiKindId[] = [HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun];

  // 1. 三元牌の刻子・槓子をカウント
  let sangenKoutsuCount = 0;
  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  for (const triplet of triplets) {
    if (sangenpai.includes(triplet.hais[0])) {
      sangenKoutsuCount++;
    }
  }

  // 大三元の条件: 三元牌の刻子が3つ全てあること
  return sangenKoutsuCount === 3;
};

export const daisangenDefinition: YakuDefinition = createYakuDefinition(
  DAISANGEN_YAKU,
  checkDaisangen,
);
