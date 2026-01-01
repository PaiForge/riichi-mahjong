import { isYaochu } from "../../../../core/hai";
import { createYakuDefinition } from "../../factory";
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

export const tanyaoDefinition: YakuDefinition = createYakuDefinition(
  TANYAO_YAKU,
  checkTanyao,
);
