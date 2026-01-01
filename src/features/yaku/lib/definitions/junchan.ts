import { isSuupai, isYaochu } from "../../../../core/hai";
import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const JUNCHAN_YAKU: Yaku = {
  name: "Junchan",
  han: {
    open: 2,
    closed: 3,
  } satisfies YakuHanConfig,
};

const checkJunchan = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") return false;

  const allBlocks = [hand.jantou, ...hand.fourMentsu];

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

export const junchanDefinition: YakuDefinition = createYakuDefinition(
  JUNCHAN_YAKU,
  checkJunchan,
);
