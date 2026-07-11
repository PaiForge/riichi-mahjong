import { createYaku } from "../builder";
import { analyzeIshokuPattern } from "../helpers";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkHonitsu = (hand: HouraStructure): boolean => {
  const result = analyzeIshokuPattern(hand);
  if (result === undefined) return false;

  // 混一色: 字牌を含み、かつ数牌が1種のみ
  return result.hasJihai && result.suupaiSuit !== undefined;
};

export const honitsuDefinition: YakuDefinition = createYaku("Honitsu", {
  open: 2,
  closed: 3,
})
  .require(checkHonitsu)
  .build();
