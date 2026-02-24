import { createYakuDefinition } from "../../factory";
import { analyzeIshokuPattern } from "../../utils";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const HONITSU_YAKU: Yaku = {
  name: "Honitsu",
  han: {
    open: 2,
    closed: 3,
  } satisfies YakuHanConfig,
};

const checkHonitsu = (hand: HouraStructure): boolean => {
  const result = analyzeIshokuPattern(hand);
  if (result === undefined) return false;

  // 混一色: 字牌を含み、かつ数牌が1種のみ
  return result.hasJihai && result.suupaiSuit !== undefined;
};

export const honitsuDefinition: YakuDefinition = createYakuDefinition(
  HONITSU_YAKU,
  checkHonitsu,
);
