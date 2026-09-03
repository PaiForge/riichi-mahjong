import type {
  HaiKindId,
  Kazehai,
  Shuntsu,
  Koutsu,
  Kantsu,
  Toitsu,
  Mentsu,
  HouraStructure,
  MentsuHouraStructure,
  ChiitoitsuHouraStructure,
  KokushiHouraStructure,
} from "../../types";

export type { Kazehai, Shuntsu, Koutsu, Kantsu, Toitsu, Mentsu };

// 後方互換性のため src/types.ts から再エクスポート
export type {
  HouraStructure,
  MentsuHouraStructure,
  ChiitoitsuHouraStructure,
  KokushiHouraStructure,
};

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
  | "Suukantsu" // 四槓子
  | "MenzenTsumo"; // 門前清自摸和

/**
 * 役の翻数 (Hansu)
 *
 * 1, 2, 3, 5(流し満貫/清一色喰い下がり), 6(清一色), 13(役満), 26(ダブル役満)
 */
export type Hansu = 1 | 2 | 3 | 5 | 6 | 13 | 26;

/**
 * 役の翻数定義
 */
export interface YakuHanConfig {
  /** 門前時の翻数 */
  readonly closed: Hansu;
  /**
   * 鳴きあり時の翻数 (0なら不成立)
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
 * 成立した役と、その翻数のペアのリスト。
 * 役が一つも成立しない場合は空配列となる。
 */
export type YakuResult = readonly [YakuName, Hansu][];

/**
 * 役満ルール設定 (YakumanRuleConfig)
 *
 * ダブル役満・複合役満の採否はローカルルールで割れるため、
 * 標準ルールからの差分としてここで指定する。**すべて既定 false**
 * （ダブル役満なし・複合の合算なし）。
 *
 * 判定パターンは2系統ある:
 *
 * - **形によるダブル役満**（`suuankouTanki` 等の4フラグ）:
 *   単一の役の翻数が待ち形などの条件で 13 → 26 に変わる。
 *   各役定義の翻数算出（dynamicHan）が {@link HouraContext} 経由で参照する
 * - **複合役満の合算**（`fukugouYakuman`）:
 *   複数の役満が同時成立したとき（字一色 + 大三元 等）に支払いを
 *   合算するか。個々の役の翻数は変わらないため役定義では扱えず、
 *   点数計算層が役満単位（{@link getYakumanMultiplier}）の集計で扱う
 */
export interface YakumanRuleConfig {
  /** 四暗刻の単騎待ちをダブル役満（26翻）とするか */
  readonly suuankouTanki?: boolean;
  /** 大四喜をダブル役満（26翻）とするか */
  readonly daisuushii?: boolean;
  /** 国士無双の十三面待ちをダブル役満（26翻）とするか */
  readonly kokushiMusouJuusanmen?: boolean;
  /** 純正九蓮宝燈（九面待ち）をダブル役満（26翻）とするか */
  readonly junseiChuurenPoutou?: boolean;
  /**
   * 複数役満の複合を合算するか
   *
   * - false: 支払いは最高位の役満1つ分（単体でダブル役満が成立して
   *   いる場合はその2個分。合算しない設定でも単体の成立は減らない）
   * - true: 各役満の役満単位（役満=1・ダブル役満=2）の合計分を支払う
   */
  readonly fukugouYakuman?: boolean;
}

/**
 * 役判定コンフィグ (DetectYakuConfig)
 *
 * detectYaku に渡す設定オブジェクト。
 * 和了牌、場風、自風、ドラ表示牌などをまとめて指定する。
 */
export interface DetectYakuConfig {
  /** 和了牌 */
  readonly agariHai: HaiKindId;
  /** 場風牌 */
  readonly bakaze?: Kazehai;
  /** 自風牌 */
  readonly jikaze?: Kazehai;
  /** ドラ表示牌のリスト */
  readonly doraMarkers?: readonly HaiKindId[];
  /** 裏ドラ表示牌のリスト */
  readonly uraDoraMarkers?: readonly HaiKindId[];
  /** ツモ和了かどうか */
  readonly isTsumo?: boolean;
  /** 役満ルール設定（任意）。未指定時はダブル役満・複合の合算なし */
  readonly ruleConfig?: YakumanRuleConfig;
}

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
  readonly isTsumo?: boolean | undefined;

  /**
   * ドラ表示牌 (表ドラ) のリスト
   */
  readonly doraMarkers: readonly HaiKindId[];

  /**
   * 裏ドラ表示牌のリスト (リーチ時のみ有効)
   */
  readonly uraDoraMarkers?: readonly HaiKindId[];

  /**
   * 役満ルール設定
   *
   * 翻数が採用ルールで変わる役定義（四暗刻単騎等）が dynamicHan から
   * 参照する。省略時はすべて標準ルール（ダブル役満なし）。
   */
  readonly yakumanRuleConfig?: YakumanRuleConfig | undefined;
}

export interface Yaku {
  readonly name: YakuName;
  /** 翻数 (喰い下がり考慮) */
  readonly han: {
    readonly open: Hansu | 0; // 鳴きあり時の翻数 (0なら不成立)
    readonly closed: Hansu; // 門前時の翻数
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
