import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { countShuntsuPairs } from "../../utils";
import { extractShuntsu } from "../helpers";

const checkRyanpeikou = (hand: HouraStructure): boolean => {
  // 順子が4つなければ二盃口はあり得ない
  if (extractShuntsu(hand).length < 4) {
    return false;
  }

  const pairCount = countShuntsuPairs(hand);
  return pairCount >= 2;
};

export const ryanpeikouDefinition: YakuDefinition = createYaku("Ryanpeikou", {
  open: 0, // 門前限定
  closed: 3,
})
  .require(checkRyanpeikou)
  .build();
