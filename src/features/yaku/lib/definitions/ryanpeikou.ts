import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { countShuntsuPairs } from "../../utils";

const checkRyanpeikou = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  const shuntsuCount = hand.fourMentsu.filter(
    (mentsu) => mentsu.type === "Shuntsu",
  ).length;

  // 順子が4つなければ二盃口はあり得ない
  if (shuntsuCount < 4) {
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
