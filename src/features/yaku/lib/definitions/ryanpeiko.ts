import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Shuntsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const RYANPEIKOU_YAKU: Yaku = {
  name: "Ryanpeikou",
  han: {
    open: 0, // 門前限定
    closed: 3,
  } satisfies YakuHanConfig,
};

const checkRyanpeikou = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const shuntsuList = hand.fourMentsu.filter(
    (mentsu): mentsu is Shuntsu => mentsu.type === "Shuntsu",
  );

  // 順子が4つなければ二盃口はあり得ない
  if (shuntsuList.length < 4) {
    return false;
  }

  // 各順子の出現数をカウントする
  // Shuntsuは [T, T, T] で、先頭の牌IDが同じなら同じ順子とみなす
  const shuntsuCounts = new Map<number, number>();

  for (const shuntsu of shuntsuList) {
    const key = shuntsu.hais[0];
    const currentCount = shuntsuCounts.get(key) ?? 0;
    shuntsuCounts.set(key, currentCount + 1);
  }

  let pairCount = 0;
  for (const count of shuntsuCounts.values()) {
    // 同じ順子が2つで1ペア。4つなら2ペア。
    pairCount += Math.floor(count / 2);
  }

  return pairCount >= 2;
};

export const ryanpeikouDefinition: YakuDefinition = createYakuDefinition(
  RYANPEIKOU_YAKU,
  checkRyanpeikou,
);
