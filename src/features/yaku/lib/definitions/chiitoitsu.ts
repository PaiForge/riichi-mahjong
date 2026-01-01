import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const CHIITOITSU_YAKU: Yaku = {
  name: "Chiitoitsu",
  han: {
    open: 0, // 門前限定
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkChiitoitsu = (hand: HouraStructure): boolean => {
  return hand.type === "Chiitoitsu";
};

export const chiitoitsuDefinition: YakuDefinition = createYakuDefinition(
  CHIITOITSU_YAKU,
  checkChiitoitsu,
);
