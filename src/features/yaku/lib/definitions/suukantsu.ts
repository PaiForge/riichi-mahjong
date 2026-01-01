import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const SUUKANTSU_YAKU: Yaku = {
  name: "Suukantsu",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

const checkSuukantsu = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 槓子を抽出
  const kantsuList = hand.fourMentsu.filter((m) => m.type === "Kantsu");

  // 2. 槓子が4つあれば成立
  return kantsuList.length === 4;
};

export const suukantsuDefinition: YakuDefinition = createYakuDefinition(
  SUUKANTSU_YAKU,
  checkSuukantsu,
);
