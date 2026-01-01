import { createYakuDefinition } from "../../factory";
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

export const kokushiDefinition: YakuDefinition = createYakuDefinition(
  {
    name: "KokushiMusou",
    han: KOKUSHI_HAN,
  },
  checkKokushi,
);
