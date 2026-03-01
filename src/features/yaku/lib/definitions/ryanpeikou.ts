import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { countShuntsuPairs } from "../../utils";

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

export const ryanpeikouDefinition: YakuDefinition = createYaku(
  RYANPEIKOU_YAKU.name,
  RYANPEIKOU_YAKU.han.closed,
  typeof RYANPEIKOU_YAKU.han.open === "number" ? RYANPEIKOU_YAKU.han.open : 0,
)
  .require(checkRyanpeikou)
  .build();
