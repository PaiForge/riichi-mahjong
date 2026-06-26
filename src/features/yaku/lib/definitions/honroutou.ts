import { isJihai, isYaochu } from "../../../../core/hai";
import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

const checkHonroutou = (hand: HouraStructure): boolean => {
  let blocks;

  if (hand.type === "Mentsu") {
    blocks = [hand.jantou, ...hand.fourMentsu];
  } else if (hand.type === "Chiitoitsu") {
    blocks = hand.pairs;
  } else {
    return false;
  }

  // 1. 全ての牌が么九牌（1・9・字牌）であること
  // これにより順子（123など）が含まれる可能性も排除される（2,3は么九牌ではないため）
  const allYaochu = blocks.every((block) =>
    block.hais.every((k) => isYaochu(k)),
  );
  if (!allYaochu) return false;

  // 2. 少なくとも1つの字牌が含まれること（清老頭の除外）
  const hasJihai = blocks.some((block) => block.hais.some((k) => isJihai(k)));
  if (!hasJihai) return false;

  return true;
};

export const honroutouDefinition: YakuDefinition = createYaku("Honroutou", {
  open: 2,
  closed: 2,
})
  .require(checkHonroutou)
  .build();
