import type {
  RuleConfig,
  YakumanRuleConfig,
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

// ルール差分設定は共有のルール設定として定義されている
export type { RuleConfig, YakumanRuleConfig };

// 後方互換性のため src/types.ts から再エクスポート
export type {
  HouraStructure,
  MentsuHouraStructure,
  ChiitoitsuHouraStructure,
  KokushiHouraStructure,
};

/**
 * 三元牌の役牌 (Sangenpai)
 *
 * 局面によらず、刻子・槓子があれば構造だけで成立する。
 */
export type Sangenpai = "Haku" | "Hatsu" | "Chun";

/**
 * 風牌の役牌 (KazeYakuhai)
 *
 * 場風（Bakaze）・自風（Jikaze）それぞれ 1 翻。連風牌（場風＝自風）の
 * 刻子は両方が成立して合計 2 翻になる。どの風が役牌かは局面
 * （{@link HouraContext} の `bakaze` / `jikaze`）で決まる。
 */
export type KazeYakuhai = "Bakaze" | "Jikaze";

/**
 * 役牌 (Yakuhai)
 *
 * 三元牌と風牌（場風・自風）。
 */
export type Yakuhai = Sangenpai | KazeYakuhai;

/**
 * 手牌役 (TehaiYaku)
 *
 * 手牌と和了時の局面（{@link HouraContext}）だけで成立が決まる役の識別子。
 * 場風・自風・門前清自摸和のように局面に依存する役も、判定に必要な情報を
 * `HouraContext` が必ず持つため、ここに含める。
 * 偶然役（嶺上開花・海底など）や宣言を要する役（立直）は含まない。
 */
export type TehaiYaku =
  | "Tanyao" // 断幺九
  | "Pinfu" // 平和
  | "Iipeikou" // 一盃口
  | Yakuhai // 役牌 (白, 發, 中, 場風, 自風)
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
 * 役判定コンフィグ (DetectYakuConfig)
 *
 * detectYaku に渡す設定オブジェクト。
 * 和了牌、場風、自風、ドラ表示牌などをまとめて指定する。
 */
export interface DetectYakuConfig {
  /** 和了牌 */
  readonly agariHai: HaiKindId;
  /** 場風牌 */
  readonly bakaze: Kazehai;
  /** 自風牌 */
  readonly jikaze: Kazehai;
  /**
   * ドラ表示牌のリスト
   *
   * 裏ドラ表示牌は受け付けない（立直を役として数えないため。理由と利用側で
   * 立直・裏ドラを足す手順は docs/scope.md を参照）。
   */
  readonly doraMarkers?: readonly HaiKindId[];
  /** ツモ和了かどうか */
  readonly isTsumo?: boolean;
  /**
   * ルール差分設定（任意）。未指定時は標準ルール
   * （ダブル役満・複合の合算なし・連風牌2符・切り上げ満貫なし）。
   *
   * 役満以外（符・点数区分）のルールも受け付けるのは、高点法で採用する解釈の
   * 決定に符と点数が関わるため。点数計算（`calculateScoreForTehai`）と同じ
   * 解釈を得るには、両APIに同じルール設定を渡すこと。
   */
  readonly ruleConfig?: RuleConfig;
}

export interface HouraContext {
  /** 手牌が門前かどうか（暗槓が含まれていても門前扱い） */
  readonly isMenzen: boolean;
  /** 和了牌（平和判定などに必要）。省略時は判定不能な役がある */
  readonly agariHai: HaiKindId;
  /**
   * 場風牌
   *
   * 雀頭が役牌かどうか（平和）や連風牌の雀頭符の判定に必要なため必須。
   */
  readonly bakaze: Kazehai;
  /**
   * 自風牌
   *
   * 雀頭が役牌かどうか（平和）や連風牌の雀頭符の判定に必要なため必須。
   */
  readonly jikaze: Kazehai;
  /** ツモ和了かどうか（暗刻系役の判定などに使用） */
  readonly isTsumo?: boolean | undefined;

  /**
   * ドラ表示牌 (表ドラ) のリスト
   *
   * 裏ドラ表示牌は受け付けない（立直を役として数えないため。理由と利用側で
   * 立直・裏ドラを足す手順は docs/scope.md を参照）。
   */
  readonly doraMarkers: readonly HaiKindId[];

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
