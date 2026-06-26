import { isSuupai, isYaochu } from "../../../../core/hai";
import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { getMentsuBlocks } from "../helpers";

const checkJunchan = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") return false;

  const allBlocks = getMentsuBlocks(hand);

  // 1. 全ての面子・雀頭に老頭牌（1・9）が含まれること
  // isYaochu(k) && isSuupai(k) で「字牌を除く么九牌」＝「老頭牌」となる
  const allHasRoutou = allBlocks.every((block) =>
    block.hais.some((k) => isYaochu(k) && isSuupai(k)),
  );
  if (!allHasRoutou) return false;

  // 2. 少なくとも1つの順子が含まれること（清老頭の除外）
  const hasShuntsu = hand.fourMentsu.some((m) => m.type === "Shuntsu");
  if (!hasShuntsu) return false;

  return true;
};

export const junchanDefinition: YakuDefinition = createYaku("Junchan", {
  open: 2,
  closed: 3,
})
  .require(checkJunchan)
  .build();
