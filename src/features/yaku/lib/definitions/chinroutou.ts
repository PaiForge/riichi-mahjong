import { isRoutou } from "../../../../core/hai";
import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { getMentsuBlocks } from "../helpers";

const checkChinroutou = (hand: HouraStructure): boolean => {
  // 老頭牌は6種類(1m,9m,1p,9p,1s,9s)しかないため、七対子(7種)は成立しない
  if (hand.type !== "Mentsu") return false;

  const allBlocks = getMentsuBlocks(hand);

  // 全てが老頭牌で構成されていること
  const allRoutou = allBlocks.every((block) => block.hais.every(isRoutou));
  if (!allRoutou) return false;

  return true;
};

export const chinroutouDefinition: YakuDefinition = createYaku("Chinroutou", {
  open: 13,
  closed: 13,
})
  .require(checkChinroutou)
  .build();
