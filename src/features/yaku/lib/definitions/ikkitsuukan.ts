import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";

import { kindIdToSuitIndex } from "../../../../core/hai";
import { extractShuntsu, getShuntsuCombinations3 } from "../helpers";

// 一気通貫の条件:
// 1. 3つの順子が全て同じ色（萬子、筒子、索子のいずれか）であること
// 2. 3つの順子がそれぞれ 1-2-3, 4-5-6, 7-8-9 であること
//    （先頭牌の数字インデックスが 0, 3, 6 と揃うこと）
const checkIkkitsuukan = (hand: HouraStructure): boolean => {
  const shuntsuList = extractShuntsu(hand);

  if (shuntsuList.length < 3) {
    return false;
  }

  return getShuntsuCombinations3(shuntsuList).some(([s1, s2, s3]) => {
    const firstHais = [s1.hais[0], s2.hais[0], s3.hais[0]];

    // 全て同じ色の数牌でなければならない（字牌は kindIdToSuitIndex が undefined）
    const suits = new Set(firstHais.map(kindIdToSuitIndex));
    if (suits.size !== 1 || suits.has(undefined)) return false;

    // 先頭牌が 1, 4, 7（0-based で 0, 3, 6）で揃っていれば成立
    const starts = new Set(firstHais.map((h) => h % 9));
    return starts.has(0) && starts.has(3) && starts.has(6);
  });
};

export const ikkitsuukanDefinition: YakuDefinition = createYaku("Ikkitsuukan", {
  open: 1,
  closed: 2,
})
  .require(checkIkkitsuukan)
  .build();
