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
  ManZu9: 8,
  PinZu1: 9,
  PinZu9: 17,
  SouZu1: 18,
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
