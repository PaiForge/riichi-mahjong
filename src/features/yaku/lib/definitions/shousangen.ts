import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { SANGENPAI_KIND_IDS } from "../../../../core/hai";
import { countSpecificKoutsu, isJantouOf } from "../helpers";

// 小三元の条件: 三元牌の刻子が2つ かつ 三元牌の雀頭が1つ
const checkShousangen = (hand: HouraStructure): boolean =>
  hand.type === "Mentsu" &&
  countSpecificKoutsu(hand, SANGENPAI_KIND_IDS) === 2 &&
  isJantouOf(hand, SANGENPAI_KIND_IDS);

export const shousangenDefinition: YakuDefinition = createYaku("Shousangen", {
  open: 2,
  closed: 2,
})
  .require(checkShousangen)
  .build();
