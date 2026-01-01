import type { YakuDefinition, HouraStructure, HouraContext } from "../../types";
import { createYakuDefinition } from "../../factory";

const definition = {
  name: "MenzenTsumo",
  han: { open: 0, closed: 1 },
} as const;

export const menzenTsumoDefinition: YakuDefinition = createYakuDefinition(
  definition,
  (hand: HouraStructure, context: HouraContext): boolean => {
    return context.isMenzen && !!context.isTsumo;
  },
);
