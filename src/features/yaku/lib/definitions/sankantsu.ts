import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkSankantsu = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 1. 槓子を抽出
  const kantsuList = hand.fourMentsu.filter((m) => m.type === "Kantsu");

  // 2. 槓子が3つ以上あれば成立
  return kantsuList.length >= 3;
};

export const sankantsuDefinition: YakuDefinition = createYaku("Sankantsu", {
  open: 2,
  closed: 2,
})
  .require(checkSankantsu)
  .build();
