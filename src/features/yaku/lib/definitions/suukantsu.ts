import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkSuukantsu = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 槓子を抽出
  const kantsuList = hand.fourMentsu.filter((m) => m.type === "Kantsu");

  // 2. 槓子が4つあれば成立
  return kantsuList.length === 4;
};

export const suukantsuDefinition: YakuDefinition = createYaku("Suukantsu", {
  open: 13,
  closed: 13,
})
  .require(checkSuukantsu)
  .build();
