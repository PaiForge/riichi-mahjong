/**
 * 符計算に関する定数定義
 */

// 符底 (FuTei)
export const FU_BASE = {
  NORMAL: 20,
  CHIITOITSU: 25,
  KOKUSHI: 20, // 便宜上
} as const;

// 和了符 (AgariFu)
export const FU_AGARI = {
  TSUMO: 2,
  MENZEN_RON: 10,
} as const;

// 雀頭符 (JantouFu)
export const FU_JANTOU = {
  YAKUHAI: 2,
  // 連風牌の扱い（設定により4符または2符）
  DOUBLE_WIND_CAP: 2,
} as const;

// 待ち符 (MachiFu)
export const FU_MACHI = {
  KANCHAN: 2,
  PENCHAN: 2,
  TANKI: 2,
  RYANMEN: 0,
  SHANPON: 0,
} as const;

// 面子符 (MentsuFu)
// [Yaochu/Suupai]_[Open/Closed]
export const FU_KOUTSU = {
  SUUPAI_OPEN: 2,
  SUUPAI_CLOSED: 4,
  YAOCHU_OPEN: 4,
  YAOCHU_CLOSED: 8,
} as const;

export const FU_KANTSU = {
  SUUPAI_OPEN: 8,
  SUUPAI_CLOSED: 16,
  YAOCHU_OPEN: 16,
  YAOCHU_CLOSED: 32,
} as const;

// 例外処理用定数
export const FU_PINFU_TSUMO = 20;
export const FU_OPEN_PINFU_GLAZE = 30; // 喰いタン平和形などの20符切り上げ
