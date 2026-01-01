import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HaiKind } from "../../../../types";

const TSUUIISOU_YAKU: Yaku = {
  name: "Tsuuiisou",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

const isJihai = (id: number): boolean => {
  return id >= HaiKind.Ton && id <= HaiKind.Chun;
};

const checkTsuuiisou = (hand: HouraStructure): boolean => {
  const allHais: number[] = [];

  if (hand.type === "Mentsu") {
    // 面子手の場合
    for (const mentsu of hand.fourMentsu) {
      allHais.push(...mentsu.hais);
    }
    allHais.push(...hand.jantou.hais);
  } else if (hand.type === "Chiitoitsu") {
    // 七対子の場合
    for (const pair of hand.pairs) {
      allHais.push(...pair.hais);
    }
  } else {
    // 国士無双など（国士は字一色にはなり得ないが、構造上は考慮）
    return false;
  }

  // 全ての牌が字牌であれば成立
  return allHais.every(isJihai);
};

export const tsuuiisouDefinition: YakuDefinition = createYakuDefinition(
  TSUUIISOU_YAKU,
  checkTsuuiisou,
);
