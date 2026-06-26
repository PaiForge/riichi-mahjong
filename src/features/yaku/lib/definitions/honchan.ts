import { isJihai, isYaochu } from "../../../../core/hai";
import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { getMentsuBlocks } from "../helpers";

const checkHonchan = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") return false;

  const allBlocks = getMentsuBlocks(hand);

  // 1. 全ての面子・雀頭に么九牌（1・9・字牌）が含まれること
  const allHasYaochu = allBlocks.every((block) =>
    block.hais.some((k) => isYaochu(k)),
  );
  if (!allHasYaochu) return false;

  // 2. 少なくとも1つの順子が含まれること（混老頭の除外）
  const hasShuntsu = hand.fourMentsu.some((m) => m.type === "Shuntsu");
  if (!hasShuntsu) return false;

  // 3. 少なくとも1つの字牌が含まれること（純全帯幺九の除外）
  const hasJihai = allBlocks.some((block) =>
    block.hais.some((k) => isJihai(k)),
  );
  if (!hasJihai) return false;

  return true;
};

export const honchanDefinition: YakuDefinition = createYaku("Honchan", {
  open: 1,
  closed: 2,
})
  .require(checkHonchan)
  .build();
