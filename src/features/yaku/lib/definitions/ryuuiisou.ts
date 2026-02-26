import { createYaku } from "../builder";
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

import { isAllHaisMatch } from "../helpers";

const isGreen = (id: number): boolean => {
  return GREEN_TILES.has(id);
};

const checkRyuuiisou = (hand: HouraStructure): boolean => {
  return isAllHaisMatch(hand, isGreen);
};

export const ryuuiisouDefinition: YakuDefinition = createYaku(
  RYUUIISOU_YAKU.name,
  RYUUIISOU_YAKU.han.closed,
  typeof RYUUIISOU_YAKU.han.open === "number" ? RYUUIISOU_YAKU.han.open : 0,
)
  .require(checkRyuuiisou)
  .build();
