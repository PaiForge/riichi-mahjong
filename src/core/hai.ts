import { type HaiId, HaiKind, type HaiKindId, HaiType } from "../types.js";
import { asHaiId, asHaiKindId } from "../utils/assertions";

/**
 * 牌種IDから牌種タイプを取得する
 */
export function kindIdToHaiType(kind: HaiKindId): HaiType {
  if (kind >= HaiKind.ManZu1 && kind <= HaiKind.ManZu9) {
    return HaiType.Manzu;
  }
  if (kind >= HaiKind.PinZu1 && kind <= HaiKind.PinZu9) {
    return HaiType.Pinzu;
  }
  if (kind >= HaiKind.SouZu1 && kind <= HaiKind.SouZu9) {
    return HaiType.Souzu;
  }
  return HaiType.Jihai;
}

/**
 * 物理牌IDから牌種IDを取得する
 * 0-35: 萬子 (36枚 = 9種 * 4枚) -> 0-8
 * 36-71: 筒子 (36枚) -> 9-17
 * 72-107: 索子 (36枚) -> 18-26
 * 108-135: 字牌 (28枚 = 7種 * 4枚) -> 27-33
 */
export function haiIdToKindId(id: HaiId): HaiKindId {
  if (id < 36) return asHaiKindId(Math.floor(id / 4));
  if (id < 72) return asHaiKindId(Math.floor((id - 36) / 4) + 9);
  if (id < 108) return asHaiKindId(Math.floor((id - 72) / 4) + 18);
  return asHaiKindId(Math.floor((id - 108) / 4) + 27);
}

/**
 * 牌種IDから数値(1-9)を取得する
 * 字牌の場合は undefined を返す
 */
export function haiKindToNumber(kind: HaiKindId): number | undefined {
  const type = kindIdToHaiType(kind);
  if (type === HaiType.Jihai) return undefined;

  if (type === HaiType.Manzu) return kind - HaiKind.ManZu1 + 1;
  if (type === HaiType.Pinzu) return kind - HaiKind.PinZu1 + 1;
  // if (kindIdToHaiType(kind) === HaiType.Souzu)
  return kind - HaiKind.SouZu1 + 1;
}

/**
 * 数牌かどうかを判定する
 */
export function isSuupai(kind: HaiKindId): boolean {
  return kindIdToHaiType(kind) !== HaiType.Jihai;
}

/**
 * 么九牌（1,9,字牌）の牌種IDセット
 */
export const YAOCHU_KIND_IDS = [
  HaiKind.ManZu1,
  HaiKind.ManZu9,
  HaiKind.PinZu1,
  HaiKind.PinZu9,
  HaiKind.SouZu1,
  HaiKind.SouZu9,
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
  HaiKind.Haku,
  HaiKind.Hatsu,
  HaiKind.Chun,
] as const;

/**
 * 么九牌（1,9,字牌）かどうかを判定する
 */
export function isYaochu(kind: HaiKindId): boolean {
  return YAOCHU_KIND_IDS.some((k) => k === kind);
}

/**
 * HaiId または HaiKindId の配列を HaiKindId の配列に正規化する。
 *
 * 配列内に HaiId の範囲外 (34以上) の値が含まれている場合、すべての要素を HaiId とみなして変換を行う。
 * すべての値が 0-33 の範囲内である場合、HaiKindId の配列であるとみなしてそのまま返す。
 *
 * NOTE: 萬子のみの手牌 (HaiId がすべて 0-33) の場合など、HaiId の配列であっても HaiKindId と誤認される可能性がある。
 * HaiId を使用する場合は、可能な限りこの関数を使用せず、呼び出し元で明示的に HaiKindId に変換することを推奨する。
 */

/**
 *
 */
export function normalizeHaiIds(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  values: readonly (HaiId | HaiKindId)[],
): HaiKindId[] {
  // ヒューリスティック: 1つでも34以上があれば HaiId とみなす
  let isHaiId = false;
  for (const v of values) {
    if (v >= 34) {
      isHaiId = true;
      break;
    }
  }

  if (isHaiId) {
    return values.map((v) => haiIdToKindId(asHaiId(v)));
  }

  return values.map((v) => asHaiKindId(v));
}
