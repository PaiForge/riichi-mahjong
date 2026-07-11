import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { KAZEHAI_KIND_IDS } from "../../../../core/hai";
import { countSpecificKoutsu, isJantouOf } from "../helpers";

// 小四喜の条件: 風牌の刻子が3つ かつ 風牌の雀頭が1つ
// (合計で4種類の風牌が揃うことになる。例: 東東東 南南南 西西西 北北)
const checkShousuushii = (hand: HouraStructure): boolean =>
  hand.type === "Mentsu" &&
  countSpecificKoutsu(hand, KAZEHAI_KIND_IDS) === 3 &&
  isJantouOf(hand, KAZEHAI_KIND_IDS);

export const shousuushiiDefinition: YakuDefinition = createYaku("Shousuushii", {
  open: 13,
  closed: 13,
})
  .require(checkShousuushii)
  .build();
