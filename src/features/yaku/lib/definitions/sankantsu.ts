import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const SANKANTSU_YAKU: Yaku = {
  name: "Sankantsu",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkSankantsu = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 槓子を抽出
  const kantsuList = hand.fourMentsu.filter((m) => m.type === "Kantsu");

  // 2. 槓子が3つ以上あれば成立
  return kantsuList.length >= 3;
};

export const sankantsuDefinition: YakuDefinition = createYakuDefinition(
  SANKANTSU_YAKU,
  checkSankantsu,
);
