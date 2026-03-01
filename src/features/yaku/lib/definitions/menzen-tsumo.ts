import type { YakuDefinition, HouraStructure, HouraContext } from "../../types";
import { createYaku } from "../builder";

const definition = {
  name: "MenzenTsumo",
  han: { open: 0, closed: 1 },
} as const;

export const menzenTsumoDefinition: YakuDefinition = createYaku(
  definition.name,
  definition.han.closed,
  definition.han.open,
)
  .require((hand: HouraStructure, context: HouraContext): boolean => {
    return context.isMenzen && !!context.isTsumo;
  })
  .build();
