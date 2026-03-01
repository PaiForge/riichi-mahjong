import { createYaku } from "../builder";
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

export const toitoiDefinition: YakuDefinition = createYaku(
  TOITOI_YAKU.name,
  TOITOI_YAKU.han.closed,
  typeof TOITOI_YAKU.han.open === "number" ? TOITOI_YAKU.han.open : 0,
)
  .require(checkToitoi)
  .build();
