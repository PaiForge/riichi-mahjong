import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HouraContext } from "../../types";
import { kindIdToSuitIndex } from "../../../../core/hai";
import { getMentsuBlocks } from "../helpers";

// 各数字（1-9）の最低必要枚数: 1112345678999
// 合計13枚が必須パーツで、残り1枚は同スートなら何でもよい。
const REQUIRED_COUNTS = [3, 1, 1, 1, 1, 1, 1, 1, 3] as const;

const checkChuurenPoutou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  // 1. 門前でなければならない
  if (!context.isMenzen) {
    return false;
  }

  // 九蓮宝燈は 111+234+567+8999+α のように必ず面子手に分解できるため、
  // Mentsu 構造として解釈されていることを前提とする
  if (hand.type !== "Mentsu") {
    return false;
  }

  const allHais = getMentsuBlocks(hand).flatMap((block) => block.hais);
  const firstHai = allHais[0];
  if (firstHai === undefined) return false;

  // 2. 清一色チェック: 全て同一スートの数牌（字牌は suit が undefined）
  const suit = kindIdToSuitIndex(firstHai);
  if (suit === undefined) return false;
  if (!allHais.every((hai) => kindIdToSuitIndex(hai) === suit)) return false;

  // 3. 数牌のカウントチェック: 1と9が3枚以上、2-8が1枚以上
  const counts = Array.from({ length: 9 }, () => 0);
  for (const hai of allHais) {
    const num = hai % 9; // 0-8
    counts[num] = (counts[num] ?? 0) + 1;
  }

  return REQUIRED_COUNTS.every((min, i) => (counts[i] ?? 0) >= min);
};

export const chuurenPoutouDefinition: YakuDefinition = createYaku(
  "ChuurenPoutou",
  { open: 0, closed: 13 },
)
  .require(checkChuurenPoutou)
  .build();
