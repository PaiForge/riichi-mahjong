import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { countShuntsuPairs } from "../../utils";

const IIPEIKO_YAKU: Yaku = {
  name: "Iipeikou",
  han: {
    open: 0, // 門前限定
    closed: 1,
  } satisfies YakuHanConfig,
};

const checkIipeikou = (hand: HouraStructure): boolean => {
  const pairCount = countShuntsuPairs(hand);

  // 一盃口: ちょうど1ペア（二盃口の除外）
  return pairCount === 1;
};

export const iipeikouDefinition: YakuDefinition = createYakuDefinition(
  IIPEIKO_YAKU,
  checkIipeikou,
);
