import { HaiKind, type HaiKindId } from "../../../../types";

import type {
  HouraStructure,
  Yaku,
  HouraContext,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import type { Shuntsu } from "../../../../types";
import { classifyMachi } from "../../../../core/machi";
import { MahjongArgumentError } from "../../../../errors";
import { createYakuDefinition } from "../../factory";

const PINFU_YAKU: Yaku = {
  name: "Pinfu",
  han: {
    open: 0,
    closed: 1,
  } satisfies YakuHanConfig,
};

const checkPinfu: (hand: HouraStructure, context: HouraContext) => boolean = (
  hand,
  context,
) => {
  // 1. 門前であること
  if (!context.isMenzen) return false;
  if (hand.type !== "Mentsu") return false;

  // 2. 雀頭が役牌でないこと
  // 三元牌、場風、自風が含まれていないことを確認
  const jantouKind = hand.jantou.hais[0];

  if (context.bakaze === undefined || context.jikaze === undefined) {
    throw new MahjongArgumentError(
      "Pinfu check requires bakaze and jikaze in context",
    );
  }

  const yakuhaiList: HaiKindId[] = [
    HaiKind.Haku,
    HaiKind.Hatsu,
    HaiKind.Chun,
    context.bakaze,
    context.jikaze,
  ];

  if (yakuhaiList.includes(jantouKind)) return false;

  // 3. 全て順子であること
  if (!hand.fourMentsu.every((m): m is Shuntsu => m.type === "Shuntsu"))
    return false;

  // 4. 両面待ちであること
  const waitType = classifyMachi(hand, context.agariHai);

  return waitType === "Ryanmen";
};

export const pinfuDefinition: YakuDefinition = createYakuDefinition(
  PINFU_YAKU,
  checkPinfu,
);
