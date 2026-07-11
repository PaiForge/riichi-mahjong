import { HaiKind, type HaiKindId, type Tehai } from "../types";
import { KAZEHAI_KIND_IDS, SANGENPAI_KIND_IDS } from "./hai";
import { asHaiKindId } from "../utils/assertions";

/**
 * 数牌スートの循環列（1→2→...→9→1）を生成する
 */
function suupaiCycle(start: HaiKindId): readonly HaiKindId[] {
  return Array.from({ length: 9 }, (_, i) => asHaiKindId(start + i));
}

/**
 * ドラ表示牌から次の牌（ドラ）への循環グループ。
 *
 * - 数牌: 各スート内で 1→2→...→9→1
 * - 風牌: 東→南→西→北→東
 * - 三元牌: 白→發→中→白
 */
const DORA_CYCLES: readonly (readonly HaiKindId[])[] = [
  suupaiCycle(HaiKind.ManZu1),
  suupaiCycle(HaiKind.PinZu1),
  suupaiCycle(HaiKind.SouZu1),
  KAZEHAI_KIND_IDS,
  SANGENPAI_KIND_IDS,
];

/**
 * ドラ表示牌から次の牌（ドラ）を求める
 * @param indicator ドラ表示牌のID (HaiKindId)
 * @returns ドラ牌のID (HaiKindId)
 */
export function getDoraNext(indicator: HaiKindId): HaiKindId {
  const cycle = DORA_CYCLES.find((c) => c.includes(indicator));
  if (cycle === undefined) return indicator; // 有効な HaiKindId なら到達しない

  const nextIndex = (cycle.indexOf(indicator) + 1) % cycle.length;
  return cycle[nextIndex] ?? indicator;
}

/**
 * 手牌に含まれるドラの数を数える
 * @param tehai 手牌
 * @param indicators ドラ表示牌のリスト
 * @returns ドラの総数
 */
export function countDora(
  tehai: Tehai,
  indicators: readonly HaiKindId[],
): number {
  const doraHais = indicators.map(getDoraNext);
  const allHais = [...tehai.closed, ...tehai.exposed.flatMap((m) => m.hais)];

  // TODO: Add Akadora counting logic here

  return allHais.reduce<number>(
    (count, hai) => count + doraHais.filter((d) => d === hai).length,
    0,
  );
}
