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

/** 自風・場風を表す牌 (東・南・西・北) */
export type Kazehai =
  | typeof HaiKind.Ton
  | typeof HaiKind.Nan
  | typeof HaiKind.Sha
  | typeof HaiKind.Pei;

export type HaiIsYaocyu<ID extends HaiKindId | HaiId> = ID extends 0 | 8 | 9
  ? true
  : false;

/**
 * 手牌 (Tehai)
 *
 * 純手牌と副露を合わせたもの。
 * @template T 牌の型 (HaiKindId | HaiId)
 */
export interface Tehai<T extends HaiKindId | HaiId = HaiKindId> {
  readonly closed: readonly T[];
  readonly exposed: readonly CompletedMentsu<T>[];
}

/**
 * ツモる前の手牌 (13枚)
 */
export type Tehai13<T extends HaiKindId | HaiId = HaiKindId> = Tehai<T>;

/**
 * ツモった後の手牌 (14枚)
 */
export type Tehai14<T extends HaiKindId | HaiId = HaiKindId> = Tehai<T>;

// ... types existing ...

/**
 * 役牌 (Yakuhai)
 *
 * 構造的に成立する三元牌。
 * ※場風・自風は状況役（Bakaze, Jikaze）として別途定義するためここには含めない。
 */
export type Yakuhai = "Haku" | "Hatsu" | "Chun";

/**
 * 構造的な役 (StructuralYaku)

 *
 * 構造的な役（手牌の構成のみで成立する役）の識別子。
 * 偶然役（嶺上開花など）や状況役（場風、自風、立直など）は含まない。
 */
export type StructuralYaku =
  | "Tanyao" // 断幺九
  | "Pinfu" // 平和
  | "Iipeikou" // 一盃口
  | Yakuhai // 役牌 (白, 發, 中)
  | "SanshokuDoujun" // 三色同順
  | "Ikkitsuukan" // 一気通貫
  | "Chanta" // 混全帯幺九
  | "Chiitoitsu" // 七対子
  | "Toitoi" // 対々和
  | "Sanankou" // 三暗刻
  | "Sankantsu" // 三槓子
  | "SanshokuDoukou" // 三色同刻
  | "Honroutou" // 混老頭
  | "Shousangen" // 小三元
  | "Honitsu" // 混一色
  | "Junchan" // 純全帯幺九
  | "Ryanpeikou" // 二盃口
  | "Chinitsu" // 清一色
  | "KokushiMusou" // 国士無双
  | "Suuankou" // 四暗刻
  | "Daisangen" // 大三元
  | "Shousuushii" // 小四喜
  | "Daisuushii" // 大四喜
  | "Tsuuiisou" // 字一色
  | "Chinroutou" // 清老頭
  | "Ryuuiisou" // 緑一色
  | "ChuurenPoutou" // 九蓮宝燈
  | "Suukantsu"; // 四槓子

/**
 * 役の飜数 (Hansu)
 *
 * 1, 2, 3, 5(流し満貫/清一色喰い下がり), 6(清一色), 13(役満), 26(ダブル役満)
 */
export type Hansu = 1 | 2 | 3 | 5 | 6 | 13 | 26;

/** 待ちの形 */
export type MachiType =
  | "Tanki" // 単騎待ち
  | "Shanpon" // 双碰待ち (シャボ)
  | "Ryanmen" // 両面待ち
  | "Kanchan" // 嵌張待ち
  | "Penchan"; // 辺張待ち

export interface MentsuHouraStructure {
  readonly type: "Mentsu";
  readonly fourMentsu: readonly [
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
  ];
  readonly jantou: Toitsu;
}

export interface ChiitoitsuHouraStructure {
  readonly type: "Chiitoitsu";
  readonly pairs: readonly [
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
    Toitsu,
  ];
}

export interface KokushiHouraStructure {
  readonly type: "Kokushi";
  /** 13種類の么九牌（重複なし） */
  readonly yaochu: readonly HaiKindId[];
  /** 雀頭となる牌の種類 */
  readonly jantou: HaiKindId;
}

export type HouraStructure =
  | MentsuHouraStructure
  | ChiitoitsuHouraStructure
  | KokushiHouraStructure;

/**
 * 役の飜数定義
 */
export interface YakuHanConfig {
  /** 門前時の飜数 */
  readonly closed: Hansu;
  /**
   * 鳴きあり時の飜数 (0なら不成立)
   *
   * @remarks
   * この値が 0 の場合、その役は**門前限定（Menzen-only）**であることを意味します。
   * 役判定ロジックにおいては、この値が 0 でかつ手牌が副露されている場合、
   * 役の条件を満たしていても不成立とみなされます。
   */
  readonly open: Hansu | 0;
}

/**
 * 役ID (YakuName)
 *
 * 全ての役の識別子ユニオン。
 */
export type YakuName = StructuralYaku;

/**
 * 役判定結果 (YakuResult)
 *
 * 成立した役と、その飜数のペアのリスト。
 * 役が一つも成立しない場合は空配列となる。
 */
export type YakuResult = readonly [YakuName, Hansu][];
