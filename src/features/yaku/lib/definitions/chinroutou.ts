import { isSuupai, isYaochu } from "../../../../core/hai";
import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const CHINROUTOU_YAKU: Yaku = {
  name: "Chinroutou",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

const checkChinroutou = (hand: HouraStructure): boolean => {
  // 老頭牌は6種類(1m,9m,1p,9p,1s,9s)しかないため、七対子(7種)は成立しない
  if (hand.type !== "Mentsu") return false;

  const allBlocks = [hand.jantou, ...hand.fourMentsu];

  // 全てが老頭牌（字牌以外の么九牌）で構成されていること
  const allRoutou = allBlocks.every((block) =>
    block.hais.every((k) => isYaochu(k) && isSuupai(k)),
  );
  if (!allRoutou) return false;

  return true;
};

export const chinroutouDefinition: YakuDefinition = createYaku(
  CHINROUTOU_YAKU.name,
  CHINROUTOU_YAKU.han.closed,
  typeof CHINROUTOU_YAKU.han.open === "number" ? CHINROUTOU_YAKU.han.open : 0,
)
  .require(checkChinroutou)
  .build();
