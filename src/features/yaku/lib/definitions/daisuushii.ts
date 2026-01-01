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

const DAISUUSHII_YAKU: Yaku = {
  name: "Daisuushii",
  han: {
    // TODO: ダブル役満（26飜）とするかはルールによるため、一旦通常の役満として実装
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

const checkDaisuushii = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const windTiles: HaiKindId[] = [
    HaiKind.Ton,
    HaiKind.Nan,
    HaiKind.Sha,
    HaiKind.Pei,
  ];

  // 1. 風牌の刻子・槓子をカウント
  let windKoutsuCount = 0;
  const triplets = hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );

  for (const triplet of triplets) {
    if (windTiles.includes(triplet.hais[0])) {
      windKoutsuCount++;
    }
  }

  // 大四喜の条件: 風牌の刻子が4つ全てあること
  return windKoutsuCount === 4;
};

export const daisuushiiDefinition: YakuDefinition = createYakuDefinition(
  DAISUUSHII_YAKU,
  checkDaisuushii,
);
