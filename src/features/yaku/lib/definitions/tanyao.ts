import { isYaochu } from "../../../../core/hai";
import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const TANYAO_YAKU: Yaku = {
  name: "Tanyao",
  han: {
    open: 1,
    closed: 1,
  } satisfies YakuHanConfig,
};

const checkTanyao = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") return false;

  // 雀頭のチェック
  if (isYaochu(hand.jantou.hais[0])) return false;

  // 面子のチェック
  for (const mentsu of hand.fourMentsu) {
    if (mentsu.hais.some(isYaochu)) return false;
  }

  return true;
};

export const tanyaoDefinition: YakuDefinition = createYaku(
  TANYAO_YAKU.name,
  TANYAO_YAKU.han.closed,
  typeof TANYAO_YAKU.han.open === "number" ? TANYAO_YAKU.han.open : 0,
)
  .require(checkTanyao)
  .build();
