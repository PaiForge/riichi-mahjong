import { createYaku } from "../builder";
import { analyzeIshokuPattern } from "../../utils";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const CHINITSU_YAKU: Yaku = {
  name: "Chinitsu",
  han: {
    open: 5,
    closed: 6,
  } satisfies YakuHanConfig,
};

const checkChinitsu = (hand: HouraStructure): boolean => {
  const result = analyzeIshokuPattern(hand);
  if (result === undefined) return false;

  // 清一色: 字牌を含まず、かつ数牌が1種のみ
  return !result.hasJihai && result.suupaiSuit !== undefined;
};

export const chinitsuDefinition: YakuDefinition = createYaku(
  CHINITSU_YAKU.name,
  CHINITSU_YAKU.han.closed,
  typeof CHINITSU_YAKU.han.open === "number" ? CHINITSU_YAKU.han.open : 0,
)
  .require(checkChinitsu)
  .build();
