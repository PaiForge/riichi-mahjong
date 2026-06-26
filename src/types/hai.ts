/**
 * 牌種IDの定数セット
 *
 * - 0-8: 萬子 (ManZu)
 * - 9-17: 筒子 (PinZu)
 * - 18-26: 索子 (SouZu)
 * - 27-33: 字牌 (JiHai)
 */
export const HAI_KIND_IDS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
] as const;

// Utility for fixed-length tuple
type TupleOf<
  T,
  N extends number,
  R extends unknown[] = [],
> = R["length"] extends N ? R : TupleOf<T, N, [T, ...R]>;

/**
 * 牌の種類の総数 (34)
 */
export type HaiKindCount = (typeof HAI_KIND_IDS)["length"];

/**
 * 特定の種類の牌の所持数 (0-4枚)
 * 各種類の牌は最大4枚まで存在します。
 */
export type HaiQuantity = 0 | 1 | 2 | 3 | 4;

/**
 * 全34種類の牌の所持数分布配列。
 * インデックスは HaiKindId (0-33) に対応します。
 * 各要素はその種類の牌の所持数 (0-4) です。
 *
 * @example
 * // "113m 1z" (MPSZ形式) に対応
 * const dist: HaiKindDistribution = [
 *   2, 0, 1, 0, 0, 0, 0, 0, 0, // 萬子 (1m x2, 3m x1)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // 筒子
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // 索子
 *   1, 0, 0, 0, 0, 0, 0        // 字牌 (1z x1)
 * ];
 */
export type HaiKindDistribution = Readonly<TupleOf<HaiQuantity, HaiKindCount>>;

/**
 * 物理的な牌の一意な識別子 (HaiId)
 *
 * 麻雀セットに含まれる136枚の牌それぞれに一意のIDが割り当てられます (0-135)。
 *
 * - 0-35: 萬子
 * - 36-71: 筒子
 * - 72-107: 索子
 * - 108-135: 字牌
 *
 * Branded Type を使用して通常の number と区別します。
 */
export type HaiId = number & { readonly __brand: "HaiId" };

/**
 * 牌種ID (HaiKindId)
 *
 * 麻雀の34種類の牌を一意に識別するID。
 */
export type HaiKindId = (typeof HAI_KIND_IDS)[number];

/**
 * 牌種 (HaiKind)
 *
 * 牌種IDに対応する定数定義。
 */
export const HaiKind = {
  ManZu1: 0,
  ManZu2: 1,
  ManZu3: 2,
  ManZu4: 3,
  ManZu5: 4,
  ManZu6: 5,
  ManZu7: 6,
  ManZu8: 7,
  ManZu9: 8,
  PinZu1: 9,
  PinZu2: 10,
  PinZu3: 11,
  PinZu4: 12,
  PinZu5: 13,
  PinZu6: 14,
  PinZu7: 15,
  PinZu8: 16,
  PinZu9: 17,
  SouZu1: 18,
  SouZu2: 19,
  SouZu3: 20,
  SouZu4: 21,
  SouZu5: 22,
  SouZu6: 23,
  SouZu7: 24,
  SouZu8: 25,
  SouZu9: 26,
  Ton: 27,
  Nan: 28,
  Sha: 29,
  Pei: 30,
  Haku: 31,
  Hatsu: 32,
  Chun: 33,
} as const;

export type HaiKind = (typeof HaiKind)[keyof typeof HaiKind];

/**
 * 牌種タイプ (HaiType)
 */
export const HaiType = {
  Manzu: "Manzu",
  Pinzu: "Pinzu",
  Souzu: "Souzu",
  Jihai: "Jihai",
} as const;

export type HaiType = (typeof HaiType)[keyof typeof HaiType];

export type Suupai =
  | typeof HaiType.Manzu
  | typeof HaiType.Pinzu
  | typeof HaiType.Souzu;

export type Jihai = typeof HaiType.Jihai;

/** 自風・場風を表す牌 (東・南・西・北) */
export type Kazehai =
  | typeof HaiKind.Ton
  | typeof HaiKind.Nan
  | typeof HaiKind.Sha
  | typeof HaiKind.Pei;

export type HaiIsYaocyu<ID extends HaiKindId | HaiId> = ID extends 0 | 8 | 9
  ? true
  : false;
