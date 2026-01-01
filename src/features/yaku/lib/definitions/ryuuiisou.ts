import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HaiKind } from "../../../../types";

const RYUUIISOU_YAKU: Yaku = {
  name: "Ryuuiisou",
  han: {
    open: 13,
    closed: 13,
  } satisfies YakuHanConfig,
};

const GREEN_TILES = new Set<number>([
  HaiKind.SouZu2,
  HaiKind.SouZu3,
  HaiKind.SouZu4,
  HaiKind.SouZu6,
  HaiKind.SouZu8,
  HaiKind.Hatsu,
]);

const isGreen = (id: number): boolean => {
  return GREEN_TILES.has(id);
};

const checkRyuuiisou = (hand: HouraStructure): boolean => {
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
    // 国士無双など
    return false;
  }

  // 全ての牌が緑色牌であれば成立
  return allHais.every(isGreen);
};

export const ryuuiisouDefinition: YakuDefinition = createYakuDefinition(
  RYUUIISOU_YAKU,
  checkRyuuiisou,
);
