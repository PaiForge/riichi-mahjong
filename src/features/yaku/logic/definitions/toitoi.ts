import { createYakuDefinition } from "../../factory";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";

const TOITOI_YAKU: Yaku = {
  name: "Toitoi",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

const checkToitoi = (hand: HouraStructure): boolean => {
  if (hand.type !== "Mentsu") {
    return false;
  }

  // 全ての面子が刻子（Koutsu）または槓子（Kantsu）であることを確認
  return hand.fourMentsu.every(
    (mentsu) => mentsu.type === "Koutsu" || mentsu.type === "Kantsu",
  );
};

export const toitoiDefinition: YakuDefinition = createYakuDefinition(
  TOITOI_YAKU,
  checkToitoi,
);
