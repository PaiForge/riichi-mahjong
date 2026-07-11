import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { countShuntsuPairs } from "../helpers";

const checkIipeikou = (hand: HouraStructure): boolean => {
  const pairCount = countShuntsuPairs(hand);

  // 一盃口: ちょうど1ペア（二盃口の除外）
  return pairCount === 1;
};

export const iipeikouDefinition: YakuDefinition = createYaku("Iipeikou", {
  open: 0, // 門前限定
  closed: 1,
})
  .require(checkIipeikou)
  .build();
