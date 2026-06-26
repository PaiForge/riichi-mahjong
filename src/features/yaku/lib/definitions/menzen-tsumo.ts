import type { YakuDefinition, HouraStructure, HouraContext } from "../../types";
import { createYaku } from "../builder";

export const menzenTsumoDefinition: YakuDefinition = createYaku("MenzenTsumo", {
  open: 0,
  closed: 1,
})
  .require((hand: HouraStructure, context: HouraContext): boolean => {
    return context.isMenzen && !!context.isTsumo;
  })
  .build();
