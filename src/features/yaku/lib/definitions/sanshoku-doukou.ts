import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { combinations3, extractTriplets, isSanshoku } from "../helpers";

const checkSanshokuDoukou = (hand: HouraStructure): boolean => {
  // 1. 刻子・槓子を抽出
  const triplets = extractTriplets(hand);

  if (triplets.length < 3) {
    return false;
  }

  // 2. 刻子の組み合わせ(3つ)が三色同刻を満たすか総当りでチェック
  return combinations3(triplets).some(([t1, t2, t3]) =>
    isSanshoku([t1.hais[0], t2.hais[0], t3.hais[0]]),
  );
};

export const sanshokuDoukouDefinition: YakuDefinition = createYaku(
  "SanshokuDoukou",
  { open: 2, closed: 2 },
)
  .require(checkSanshokuDoukou)
  .build();
