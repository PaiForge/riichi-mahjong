/**
 * ルール差分設定 (RuleConfig)
 *
 * 麻雀にはローカルルールによる差異があるため、標準ルールからの差分のみを
 * 設定として受け取る。未指定のフィールドはすべて標準ルールとして扱う。
 *
 * 役判定・符計算・点数計算のいずれの層からも参照するため、特定の feature
 * ではなく共有の型として定義する。
 */

/**
 * 符計算のルール差分設定 (FuRuleConfig)
 */
export interface FuRuleConfig {
  /**
   * 連風牌（場風＝自風）の雀頭符。
   *
   * - 2: 通常の役牌と同じく2符（デフォルト）
   * - 4: 場風2符＋自風2符として4符
   */
  readonly doubleWindJantouFu?: 2 | 4;
}

/**
 * 点数区分のルール差分設定 (ScoreLevelRuleConfig)
 *
 * 翻数・符から点数区分（満貫など）を決める際のルール差分。符の値そのものは
 * 変えないため {@link FuRuleConfig} とは分けている。
 */
export interface ScoreLevelRuleConfig {
  /**
   * 切り上げ満貫とするか (KiriageMangan)
   *
   * - false: 基本点をそのまま使う（デフォルト）
   * - true: 基本点1920（30符4翻・60符3翻）を満貫に切り上げる
   *   （子ロン 7700 → 8000、親ロン 11600 → 12000 など）
   *
   * 翻数・符は変わらず、点数区分と支払いだけが満貫になる。
   */
  readonly kiriageMangan?: boolean;
}

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
 *   各役定義の翻数算出（dynamicHan）が和了コンテキスト経由で参照する
 * - **複合役満の合算**（`fukugouYakuman`）:
 *   複数の役満が同時成立したとき（字一色 + 大三元 等）に支払いを
 *   合算するか。個々の役の翻数は変わらないため役定義では扱えず、
 *   点数計算層が役満単位（`getYakumanMultiplier`）の集計で扱う
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
 * ルール差分設定 (RuleConfig)
 *
 * 符計算（{@link FuRuleConfig}）・点数区分（{@link ScoreLevelRuleConfig}）・
 * 役満（{@link YakumanRuleConfig}）のルール差分をまとめて指定する。
 * 未指定のフィールドはすべて標準ルール（連風牌2符・切り上げ満貫なし・
 * ダブル役満なし・複合役満の合算なし）として扱う。
 *
 * 役判定と点数計算は同じ和了構造の解釈を採用する必要があるため、両APIには
 * 同じルール設定を渡すこと。
 */
export interface RuleConfig
  extends FuRuleConfig, ScoreLevelRuleConfig, YakumanRuleConfig {}
