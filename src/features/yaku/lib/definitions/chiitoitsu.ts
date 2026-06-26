import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkChiitoitsu = (hand: HouraStructure): boolean => {
  return hand.type === "Chiitoitsu";
};

export const chiitoitsuDefinition: YakuDefinition = createYaku("Chiitoitsu", {
  open: 0, // 門前限定
  closed: 2,
})
  .require(checkChiitoitsu)
  .build();
