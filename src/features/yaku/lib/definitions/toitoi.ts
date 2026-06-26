import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkToitoi = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 全ての面子が刻子（Koutsu）または槓子（Kantsu）であることを確認
  return hand.fourMentsu.every(
    (mentsu) => mentsu.type === "Koutsu" || mentsu.type === "Kantsu",
  );
};

export const toitoiDefinition: YakuDefinition = createYaku("Toitoi", {
  open: 2,
  closed: 2,
})
  .require(checkToitoi)
  .build();
