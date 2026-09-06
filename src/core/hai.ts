import { type HaiId, HaiKind, type HaiKindId, HaiType } from "../types";
import { asHaiKindId } from "../utils/assertions";

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
  if (kindIdToHaiType(kind) === HaiType.Jihai) return undefined;

  // 数牌は各スートとも9種連続で並んでいるため、剰余で数値を導出できる
  return (kind % 9) + 1;
}

/**
 * 数牌かどうかを判定する
 */
export function isSuupai(kind: HaiKindId): boolean {
  return kindIdToHaiType(kind) !== HaiType.Jihai;
}

/**
 * 字牌かどうかを判定する
 */
export function isJihai(kind: HaiKindId): boolean {
  return kindIdToHaiType(kind) === HaiType.Jihai;
}

/**
 * 牌種IDから数牌の色インデックス（0:萬子, 1:筒子, 2:索子）を取得する
 * 字牌の場合は undefined を返す
 */
export function kindIdToSuitIndex(kind: HaiKindId): number | undefined {
  const type = kindIdToHaiType(kind);
  if (type === HaiType.Manzu) return 0;
  if (type === HaiType.Pinzu) return 1;
  if (type === HaiType.Souzu) return 2;
  return undefined;
}

/**
 * 風牌（東・南・西・北）の牌種IDセット
 */
export const KAZEHAI_KIND_IDS = [
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
] as const;

/**
 * 三元牌（白・發・中）の牌種IDセット
 */
export const SANGENPAI_KIND_IDS = [
  HaiKind.Haku,
  HaiKind.Hatsu,
  HaiKind.Chun,
] as const;

const SANGENPAI_KIND_ID_SET: ReadonlySet<HaiKindId> = new Set(
  SANGENPAI_KIND_IDS,
);

/**
 * 三元牌（白・發・中）かどうかを判定する
 */
export function isSangenpai(kind: HaiKindId): boolean {
  return SANGENPAI_KIND_ID_SET.has(kind);
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
  ...KAZEHAI_KIND_IDS,
  ...SANGENPAI_KIND_IDS,
] as const;

const YAOCHU_KIND_ID_SET: ReadonlySet<HaiKindId> = new Set(YAOCHU_KIND_IDS);

/**
 * 么九牌（1,9,字牌）かどうかを判定する
 */
export function isYaochu(kind: HaiKindId): boolean {
  return YAOCHU_KIND_ID_SET.has(kind);
}

/**
 * 老頭牌（1,9の数牌）かどうかを判定する
 *
 * 么九牌のうち字牌を除いたもの。純全帯幺九・清老頭の判定に使用する。
 */
export function isRoutou(kind: HaiKindId): boolean {
  return isYaochu(kind) && isSuupai(kind);
}
