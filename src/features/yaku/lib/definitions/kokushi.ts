import { createYaku } from "../builder";
import type {
  HouraStructure,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const checkKokushi = (hand: HouraStructure): boolean => {
  return hand.type === "Kokushi";
};

const KOKUSHI_HAN: YakuHanConfig = {
  closed: 13,
  open: 0,
};

export const kokushiDefinition: YakuDefinition = createYaku(
  "KokushiMusou",
  KOKUSHI_HAN.closed,
  0,
)
  .require(checkKokushi)
  .build();
