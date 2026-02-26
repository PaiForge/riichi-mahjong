import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HaiKind } from "../../../../types";

const TSUUIISOU_YAKU: Yaku = {
  name: "Tsuuiisou",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

import { isAllHaisMatch } from "../helpers";

const isJihai = (id: number): boolean => {
  return id >= HaiKind.Ton && id <= HaiKind.Chun;
};

const checkTsuuiisou = (hand: HouraStructure): boolean => {
  return isAllHaisMatch(hand, isJihai);
};

export const tsuuiisouDefinition: YakuDefinition = createYakuDefinition(
  TSUUIISOU_YAKU,
  checkTsuuiisou,
);
