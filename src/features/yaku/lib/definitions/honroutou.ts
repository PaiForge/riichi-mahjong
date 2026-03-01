import { isYaochu, kindIdToHaiType } from "../../../../core/hai";
import { HaiType } from "../../../../types";
import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const HONROUTOU_YAKU: Yaku = {
  name: "Honroutou",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

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
  const hasJihai = blocks.some((block) =>
    block.hais.some((k) => kindIdToHaiType(k) === HaiType.Jihai),
  );
  if (!hasJihai) return false;

  return true;
};

export const honroutouDefinition: YakuDefinition = createYaku(
  HONROUTOU_YAKU.name,
  HONROUTOU_YAKU.han.closed,
  typeof HONROUTOU_YAKU.han.open === "number" ? HONROUTOU_YAKU.han.open : 0,
)
  .require(checkHonroutou)
  .build();
