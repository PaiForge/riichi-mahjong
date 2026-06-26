import { createYaku } from "../builder";

import type { HouraStructure, YakuDefinition } from "../../types";

import {
  extractShuntsu,
  getShuntsuCombinations3,
  isSanshoku,
} from "../helpers";

const checkSanshokuDoujun = (hand: HouraStructure): boolean => {
  const shuntsuList = extractShuntsu(hand);

  if (shuntsuList.length < 3) {
    return false;
  }

  // 順子の組み合わせ(3つ)が三色同順（異なる3色・同一数字）を満たすか総当りでチェック
  return getShuntsuCombinations3(shuntsuList).some(([s1, s2, s3]) =>
    isSanshoku([s1.hais[0], s2.hais[0], s3.hais[0]]),
  );
};

export const sanshokuDoujunDefinition: YakuDefinition = createYaku(
  "SanshokuDoujun",
  { open: 1, closed: 2 },
)
  .require(checkSanshokuDoujun)
  .build();
