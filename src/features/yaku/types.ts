import type {
  HaiKindId,
  Kazehai,
  Shuntsu,
  Koutsu,
  Kantsu,
  Toitsu,
  Mentsu,
  CompletedMentsu,
} from "../../types";

export type { Kazehai, Shuntsu, Koutsu, Kantsu, Toitsu, Mentsu };

/**
 * 役牌 (Yakuhai)
 *
 * 構造的に成立する三元牌。
 * ※場風・自風は状況役（Bakaze, Jikaze）として別途定義するためここには含めない。
 */
export type Yakuhai = "Haku" | "Hatsu" | "Chun";

/**
 * 手牌役 (TehaiYaku)
 *
 * 手牌役（手牌の構成のみで成立する役）の識別子。
 * 偶然役（嶺上開花など）や状況役（場風、自風、立直など）は含まない。
 */
export type TehaiYaku =
  | "Tanyao" // 断幺九
  | "Pinfu" // 平和
  | "Iipeikou" // 一盃口
  | Yakuhai // 役牌 (白, 發, 中)
  | "SanshokuDoujun" // 三色同順
  | "Ikkitsuukan" // 一気通貫
  | "Honchan" // 混全帯幺九
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
export type YakuName = TehaiYaku;

/**
 * 役判定結果 (YakuResult)
 *
 * 成立した役と、その飜数のペアのリスト。
 * 役が一つも成立しない場合は空配列となる。
 */
export type YakuResult = readonly [YakuName, Hansu][];

export interface HouraContext {
  /** 手牌が門前かどうか（暗槓が含まれていても門前扱い） */
  readonly isMenzen: boolean;
  /** 和了牌（平和判定などに必要）。省略時は判定不能な役がある */
  readonly agariHai: HaiKindId;
  /** 場風牌 */
  readonly bakaze?: Kazehai | undefined;
  /** 自風牌 */
  readonly jikaze?: Kazehai | undefined;
  /** ツモ和了かどうか（暗刻系役の判定などに使用） */
  readonly isTsumo?: boolean;
}

export interface Yaku {
  readonly name: YakuName;
  /** 飜数 (喰い下がり考慮) */
  readonly han: {
    readonly open: Hansu | 0; // 鳴きあり時の飜数 (0なら不成立)
    readonly closed: Hansu; // 門前時の飜数
  };
}

/**
 * 役の成立判定関数
 * @param hand 分解された手牌構造
 * @param context 判定コンテキスト
 * @returns 成立回数 (0なら不成立、役牌などで複数成立しうる)
 */
export type YakuCheck = (hand: HouraStructure, context: HouraContext) => number;

export interface YakuDefinition {
  readonly yaku: Yaku;
  readonly isSatisfied: (
    hand: HouraStructure,
    context: HouraContext,
  ) => boolean;
  readonly getHansu: (hand: HouraStructure, context: HouraContext) => Hansu | 0;
}
