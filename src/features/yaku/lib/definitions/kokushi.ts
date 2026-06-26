import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkKokushi = (hand: HouraStructure): boolean => {
  return hand.type === "Kokushi";
};

export const kokushiDefinition: YakuDefinition = createYaku("KokushiMusou", {
  open: 0,
  closed: 13,
})
  .require(checkKokushi)
  .build();
