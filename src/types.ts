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
 * シャンテン数 (ShantenNumber)
 *
 * 和了までの手数 - 1 を表す数値。
 *
 * - 0: テンパイ (Tenpai) - 次の1手で和了できる状態
 * - 1: 1シャンテン - テンパイまであと1手
 * - ...
 * - 13: 理論上の最大値 (例: 13面待ちでない国士無双の初期状態など)
 *
 * ※ 本ライブラリでは、ツモる前の13枚の手牌に対する計算を前提とするため、
 *    和了 (-1) はこの型には含めない。
 */
export type ShantenNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

/**
 * 他家 (Tacha)
 *
 * 自分から見た他家の位置関係（相対席）。
 * 副露（鳴き）の発生元などを表現するために使用する。
 *
 * - 1: 下家 (Shimocha) - 右側
 * - 2: 対面 (Toimen) - 正面
 * - 3: 上家 (Kamicha) - 左側
 */
export const Tacha = {
  Shimocha: 1,
  Toimen: 2,
  Kamicha: 3,
} as const;

export type Tacha = (typeof Tacha)[keyof typeof Tacha];

/**
 * 副露種別 (FuroType)
 */
export const FuroType = {
  Chi: "Chi",
  Pon: "Pon",
  Daiminkan: "Daiminkan",
  Kakan: "Kakan",
} as const;

export type FuroType = (typeof FuroType)[keyof typeof FuroType];

/**
 * 副露 (Furo)
 *
 * 面子に対する「鳴き」のメタ情報。
 * ここでは副露を「自分の手牌が不足している面子を、他家が捨てた牌を取って完成させる行為」と定義し、
 * 暗槓（自力で4枚揃える行為）はここには含めない。
 *
 * 構成する牌自体はここには含めず、この型を持つ親（Mentsuなど）が保持することを想定する。
 */
export type Furo =
  | { type: typeof FuroType.Chi; from: Tacha }
  | { type: typeof FuroType.Pon; from: Tacha }
  | { type: typeof FuroType.Daiminkan; from: Tacha }
  | { type: typeof FuroType.Kakan; from: Tacha };

/**
 * 面子種別 (MentsuType)
 */
export const MentsuType = {
  Shuntsu: "Shuntsu", // 順子 (123)
  Koutsu: "Koutsu", // 刻子 (111)
  Kantsu: "Kantsu", // 槓子 (1111)
  Toitsu: "Toitsu", // 対子 (11)
  Tatsu: "Tatsu", // 塔子 (12, 13)
} as const;

export type MentsuType = (typeof MentsuType)[keyof typeof MentsuType];

/**
 * 基本的な面子構造 (ジェネリック)
 *
 * 牌の型をジェネリクス `T` で抽象化することで、以下の両方のユースケースに対応します：
 * 1. `HaiKindId`: MPSZ形式の手牌をもとにシャンテン計算を行うなど、牌の種類のみに関心がある場合（抽象的な計算）。
 * 2. `HaiId`: 実際のゲームの牌譜など、牌の物理的なIDを処理対象とする場合（具象的な計算）。
 */
interface BaseMentsu<T extends HaiKindId | HaiId> {
  type: MentsuType;
  /**
   * 構成する牌のリスト。
   *
   * 各面子型（Shuntsu等）において固定長タプル（例: `[T, T, T]`）として再定義することで、
   * 面子の種類ごとの正しい牌枚数（順子なら3枚、槓子なら4枚など）を型レベルで強制します。
   */
  hais: readonly T[];
}

/**
 * 順子 (Shuntsu)
 */
export type Shuntsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  type: typeof MentsuType.Shuntsu;
  hais: [T, T, T];
  furo?: Furo;
};

/**
 * 刻子 (Koutsu)
 */
export type Koutsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  type: typeof MentsuType.Koutsu;
  hais: [T, T, T];
  furo?: Furo;
};

/**
 * 槓子 (Kantsu)
 */
export type Kantsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  type: typeof MentsuType.Kantsu;
  hais: [T, T, T, T];
  furo?: Furo;
};

/**
 * 対子 (Toitsu)
 */
export type Toitsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  type: typeof MentsuType.Toitsu;
  hais: [T, T];
  furo?: never;
};

/**
 * 塔子 (Tatsu)
 */
export type Tatsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  type: typeof MentsuType.Tatsu;
  hais: [T, T];
  furo?: never;
};

/**
 * 完成面子 (CompletedMentsu)
 * - 順子 (Shuntsu)
 * - 刻子 (Koutsu)
 * - 槓子 (Kantsu)
 */
export type CompletedMentsu<T extends HaiKindId | HaiId = HaiKindId> =
  | Shuntsu<T>
  | Koutsu<T>
  | Kantsu<T>;

/**
 * 未完成面子 (IncompletedMentsu)
 * - 対子 (Toitsu)
 * - 塔子 (Tatsu)
 */
export type IncompletedMentsu<T extends HaiKindId | HaiId = HaiKindId> =
  | Toitsu<T>
  | Tatsu<T>;

/**
 * 面子 (Mentsu)
 *
 * 広義の面子（ブロック）。指定がない場合は HaiKindId のリストを持つ。
 */
export type Mentsu<T extends HaiKindId | HaiId = HaiKindId> =
  | CompletedMentsu<T>
  | IncompletedMentsu<T>;
