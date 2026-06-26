import { isYaochu } from "../../../../core/hai";
import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

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

export const tanyaoDefinition: YakuDefinition = createYaku("Tanyao", {
  open: 1,
  closed: 1,
})
  .require(checkTanyao)
  .build();
