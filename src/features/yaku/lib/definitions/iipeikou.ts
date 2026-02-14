import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Shuntsu,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const IIPEIKO_YAKU: Yaku = {
  name: "Iipeikou",
  han: {
    open: 0, // 門前限定
    closed: 1,
  } satisfies YakuHanConfig,
};

const checkIipeikou = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const shuntsuList = hand.fourMentsu.filter(
    (mentsu): mentsu is Shuntsu => mentsu.type === "Shuntsu",
  );

  // 順子が2つ未満なら一盃口はあり得ない
  if (shuntsuList.length < 2) {
    return false;
  }

  // 同一順子のペア数をカウントする
  // 二盃口（ペア数 >= 2）の場合は上位互換のため一盃口不成立
  const shuntsuCounts = new Map<number, number>();
  for (const shuntsu of shuntsuList) {
    const key = shuntsu.hais[0];
    const currentCount = shuntsuCounts.get(key) ?? 0;
    shuntsuCounts.set(key, currentCount + 1);
  }

  let pairCount = 0;
  for (const count of shuntsuCounts.values()) {
    pairCount += Math.floor(count / 2);
  }

  // 一盃口: ちょうど1ペア（二盃口の除外）
  return pairCount === 1;
};

export const iipeikouDefinition: YakuDefinition = createYakuDefinition(
  IIPEIKO_YAKU,
  checkIipeikou,
);
