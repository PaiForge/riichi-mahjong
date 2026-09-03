import { createYaku } from "../builder";
import type { HouraStructure, YakuDefinition } from "../../types";
import { HouraContext } from "../../types";
import { kindIdToSuitIndex } from "../../../../core/hai";
import { getMentsuBlocks } from "../helpers";

// 各数字（1-9）の最低必要枚数: 1112345678999
// 合計13枚が必須パーツで、残り1枚は同スートなら何でもよい。
const REQUIRED_COUNTS = [3, 1, 1, 1, 1, 1, 1, 1, 3] as const;

/**
 * 手牌14枚の数字（1-9）ごとの枚数を数える
 */
const countNumbers = (hand: HouraStructure): number[] => {
  const counts = Array.from({ length: 9 }, () => 0);
  if (hand.type !== "Mentsu") return counts;
  for (const block of getMentsuBlocks(hand)) {
    for (const hai of block.hais) {
      const num = hai % 9; // 0-8
      counts[num] = (counts[num] ?? 0) + 1;
    }
  }
  return counts;
};

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
  const counts = countNumbers(hand);
  return REQUIRED_COUNTS.every((min, i) => (counts[i] ?? 0) >= min);
};

/**
 * 純正九蓮宝燈（九面待ち）かどうかを判定する
 *
 * 和了牌を1枚除いた13枚が純正形（1112345678999）とちょうど一致するなら、
 * 和了前の手はどの数字でも和了れる九面待ちだったことになる。
 *
 * 成立済みの九蓮宝燈（清一色・同一スート確認済み）に対してのみ呼ぶこと。
 */
const isJunseiChuurenPoutou = (
  hand: HouraStructure,
  context: HouraContext,
): boolean => {
  const counts = countNumbers(hand);
  const agariNum = context.agariHai % 9; // 手牌と同一スートであることは確認済み
  counts[agariNum] = (counts[agariNum] ?? 0) - 1;
  return REQUIRED_COUNTS.every((required, i) => counts[i] === required);
};

/**
 * 九蓮宝燈。同一スートの 1112345678999 + 任意の1枚で成立する役満。
 *
 * 純正形（九面待ち）の場合、ルール設定
 * （`yakumanRuleConfig.junseiChuurenPoutou`）が有効ならダブル役満（26翻）
 * として扱う。既定は無効（13翻）。
 */
export const chuurenPoutouDefinition: YakuDefinition = createYaku(
  "ChuurenPoutou",
  { open: 0, closed: 13 },
)
  .require(checkChuurenPoutou)
  .dynamicHan((hand, context) =>
    isJunseiChuurenPoutou(hand, context) &&
    context.yakumanRuleConfig?.junseiChuurenPoutou === true
      ? 26
      : 13,
  )
  .build();
