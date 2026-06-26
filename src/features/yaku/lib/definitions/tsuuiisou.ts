import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { isJihai } from "../../../../core/hai";
import { isAllHaisMatch } from "../helpers";

const checkTsuuiisou = (hand: HouraStructure): boolean => {
  return isAllHaisMatch(hand, isJihai);
};

export const tsuuiisouDefinition: YakuDefinition = createYaku("Tsuuiisou", {
  open: 13,
  closed: 13,
})
  .require(checkTsuuiisou)
  .build();
