import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HaiKind } from "../../../../types";
import { isAllHaisMatch } from "../helpers";

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
  return isAllHaisMatch(hand, isGreen);
};

export const ryuuiisouDefinition: YakuDefinition = createYaku("Ryuuiisou", {
  open: 13,
  closed: 13,
})
  .require(checkRyuuiisou)
  .build();
