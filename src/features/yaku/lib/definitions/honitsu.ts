import { createYaku } from "../builder";
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

export const honitsuDefinition: YakuDefinition = createYaku(
  HONITSU_YAKU.name,
  HONITSU_YAKU.han.closed,
  typeof HONITSU_YAKU.han.open === "number" ? HONITSU_YAKU.han.open : 0,
)
  .require(checkHonitsu)
  .build();
