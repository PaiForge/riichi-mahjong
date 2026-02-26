import { createYaku } from "../builder";
import type {
  HouraStructure,
  Yaku,
  YakuDefinition,
  YakuHanConfig,
} from "../../types";
import { HouraContext } from "../../types";

const SANANKOU_YAKU: Yaku = {
  name: "Sanankou",
  han: {
    open: 2,
    closed: 2,
  } satisfies YakuHanConfig,
};

import { countAnkou } from "../helpers";

const checkSanankou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  const ankouCount = countAnkou(hand, context);
  return ankouCount >= 3;
};

export const sanankouDefinition: YakuDefinition = createYaku(
  SANANKOU_YAKU.name,
  SANANKOU_YAKU.han.closed,
  typeof SANANKOU_YAKU.han.open === "number" ? SANANKOU_YAKU.han.open : 0,
)
  .require(checkSanankou)
  .build();
