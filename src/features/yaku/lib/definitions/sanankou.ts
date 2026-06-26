import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HouraContext } from "../../types";
import { countAnkou } from "../helpers";

const checkSanankou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  const ankouCount = countAnkou(hand, context);
  return ankouCount >= 3;
};

export const sanankouDefinition: YakuDefinition = createYaku("Sanankou", {
  open: 2,
  closed: 2,
})
  .require(checkSanankou)
  .build();
