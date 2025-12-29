import { HaiKind, type HaiKindId, type Tehai } from "../types";
import { kindIdToHaiType } from "./hai";
import { HaiType } from "../types";
import { asHaiKindId } from "../utils/assertions";

/**
 * ドラ表示牌から次の牌（ドラ）を求める
 * @param indicator ドラ表示牌のID (HaiKindId)
 * @returns ドラ牌のID (HaiKindId)
 */
export function getDoraNext(indicator: HaiKindId): HaiKindId {
  const type = kindIdToHaiType(indicator);

  if (type === HaiType.Manzu) {
    if (indicator === HaiKind.ManZu9) return HaiKind.ManZu1;
    return asHaiKindId(indicator + 1);
  }

  if (type === HaiType.Pinzu) {
    if (indicator === HaiKind.PinZu9) return HaiKind.PinZu1;
    return asHaiKindId(indicator + 1);
  }

  if (type === HaiType.Souzu) {
    if (indicator === HaiKind.SouZu9) return HaiKind.SouZu1;
    return asHaiKindId(indicator + 1);
  }

  // Jihai
  // Ton(27) -> Nan(28) -> Sha(29) -> Pei(30) -> Ton(27)
  if (indicator === HaiKind.Pei) return HaiKind.Ton;
  if (indicator >= HaiKind.Ton && indicator < HaiKind.Pei) {
    return asHaiKindId(indicator + 1);
  }

  // Haku(31) -> Hatsu(32) -> Chun(33) -> Haku(31)
  if (indicator === HaiKind.Chun) return HaiKind.Haku;
  if (indicator >= HaiKind.Haku && indicator < HaiKind.Chun) {
    return asHaiKindId(indicator + 1);
  }

  // Should not happen for valid HaiKindId
  return indicator;
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
  let count = 0;
  // Calculate actual dora hinds
  const doraHais = indicators.map(getDoraNext);

  // Count in closed hand
  for (const hai of tehai.closed) {
    for (const dora of doraHais) {
      if (hai === dora) count++;
    }
  }

  // Count in exposed mentsu
  for (const mentsu of tehai.exposed) {
    for (const hai of mentsu.hais) {
      for (const dora of doraHais) {
        if (hai === dora) count++;
      }
    }
  }

  // TODO: Add Akadora counting logic here

  return count;
}
