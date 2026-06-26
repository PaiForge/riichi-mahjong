import type { HaiKindId, HaiId } from "./hai";

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
  | { readonly type: typeof FuroType.Chi; readonly from: Tacha }
  | { readonly type: typeof FuroType.Pon; readonly from: Tacha }
  | { readonly type: typeof FuroType.Daiminkan; readonly from: Tacha }
  | { readonly type: typeof FuroType.Kakan; readonly from: Tacha };

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
  readonly type: MentsuType;
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
  readonly type: typeof MentsuType.Shuntsu;
  readonly hais: readonly [T, T, T];
  readonly furo?: Furo;
};

/**
 * 刻子 (Koutsu)
 */
export type Koutsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  readonly type: typeof MentsuType.Koutsu;
  readonly hais: readonly [T, T, T];
  readonly furo?: Furo;
};

/**
 * 槓子 (Kantsu)
 */
export type Kantsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  readonly type: typeof MentsuType.Kantsu;
  readonly hais: readonly [T, T, T, T];
  readonly furo?: Furo;
};

/**
 * 対子 (Toitsu)
 */
export type Toitsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  readonly type: typeof MentsuType.Toitsu;
  readonly hais: readonly [T, T];
  readonly furo?: never;
};

/**
 * 塔子 (Tatsu)
 */
export type Tatsu<T extends HaiKindId | HaiId = HaiKindId> = BaseMentsu<T> & {
  readonly type: typeof MentsuType.Tatsu;
  readonly hais: readonly [T, T];
  readonly furo?: never;
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
