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

const SHOUSUUSHII_YAKU: Yaku = {
  name: "Shousuushii",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

const checkShousuushii = (hand: HouraStructure): boolean => {
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

  // 2. 風牌の雀頭があるかチェック
  const isWindJantou = windTiles.includes(hand.jantou.hais[0]);

  // 小四喜の条件: 風牌の刻子が3つ かつ 風牌の雀頭が1つ
  // (合計で4種類の風牌が揃うことになる。例: 東東東 南南南 西西西 北北)
  return windKoutsuCount === 3 && isWindJantou;
};

export const shousuushiiDefinition: YakuDefinition = createYakuDefinition(
  SHOUSUUSHII_YAKU,
  checkShousuushii,
);
