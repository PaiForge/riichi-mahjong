import { createYaku } from "../builder";
import { analyzeIshokuPattern } from "../../utils";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkChinitsu = (hand: HouraStructure): boolean => {
  const result = analyzeIshokuPattern(hand);
  if (result === undefined) return false;

  // 清一色: 字牌を含まず、かつ数牌が1種のみ
  return !result.hasJihai && result.suupaiSuit !== undefined;
};

export const chinitsuDefinition: YakuDefinition = createYaku("Chinitsu", {
  open: 5,
  closed: 6,
})
  .require(checkChinitsu)
  .build();
