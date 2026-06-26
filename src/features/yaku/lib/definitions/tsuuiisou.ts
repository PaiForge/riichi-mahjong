import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HaiKind } from "../../../../types";
import { isAllHaisMatch } from "../helpers";

const isJihai = (id: number): boolean => {
  return id >= HaiKind.Ton && id <= HaiKind.Chun;
};

const checkTsuuiisou = (hand: HouraStructure): boolean => {
  return isAllHaisMatch(hand, isJihai);
};

export const tsuuiisouDefinition: YakuDefinition = createYaku("Tsuuiisou", {
  open: 13,
  closed: 13,
})
  .require(checkTsuuiisou)
  .build();
