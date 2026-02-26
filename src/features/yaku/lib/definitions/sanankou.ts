import { createYakuDefinition } from "../../factory";
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

export const sanankouDefinition: YakuDefinition = createYakuDefinition(
  SANANKOU_YAKU,
  checkSanankou,
);
