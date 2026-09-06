import { type Result, ok, err } from "neverthrow";
import { type Tehai14, HaiKind } from "../../types";
import { NoYakuError } from "../../errors";
import { selectHouraInterpretation } from "../houra";
import { isMenzen } from "../yaku/utils";
import { calculateScoreFromHanAndFu } from "./lib/calculation";
import {
  ScoreLevel,
  type ScoreCalculationConfig,
  type ScoreContext,
  type ScoreResult,
  type ScoreDetail,
} from "./types";

export type {
  ScoreCalculationConfig,
  CalculateScoreConfig,
  ScoreResult,
  ScoreDetail,
  Payment,
  Ron,
  KoTsumo,
  OyaTsumo,
  FuRuleConfig,
  RuleConfig,
} from "./types";
export { ScoreLevel };

// 点数の純粋計算ロジック（公開API・テスト用に再エクスポート）
export {
  calculateBasePoints,
  getScoreLevel,
  getPaymentTotal,
  calculateScore,
  calculateScoreFromHanAndFu,
  getYakumanMultiplier,
} from "./lib/calculation";

/**
 * 点数計算用コンテキストを作成する
 *
 * @param tehai 手牌 (14枚)
 * @param config 点数計算の設定
 * @returns 点数計算用コンテキスト
 */
function createScoreContext(
  tehai: Tehai14,
  config: Readonly<ScoreCalculationConfig>,
): ScoreContext {
  return {
    isMenzen: isMenzen(tehai),
    agariHai: config.agariHai,
    bakaze: config.bakaze,
    jikaze: config.jikaze,
    isTsumo: config.isTsumo,
    isOya: config.jikaze === HaiKind.Ton,
    doraMarkers: config.doraMarkers,
    // RuleConfig は YakumanRuleConfig を内包するためそのまま渡せる
    yakumanRuleConfig: config.ruleConfig,
  };
}

/**
 * 手牌とコンテキストから点数を計算する（公開API）
 *
 * 手牌の構造解析を行い、高点法（最も高い点数になる解釈を採用する）で選んだ
 * 解釈の点数を返します。採用する解釈の決定は役判定（`detectYaku`）と同一の
 * 処理（{@link selectHouraInterpretation}）で行われるため、両APIの役リスト・
 * 翻数・符が食い違うことはありません。
 *
 * 役が一つも成立しない手（役なしの形式和了）はドメイン上の失敗であり、
 * 呼び出し側で必ず扱う必要があるため {@link NoYakuError} を Err として返します。
 *
 * @param tehai 手牌 (14枚)
 * @param config 点数計算の設定 (場風、自風、ドラなど)
 * @returns 点数計算結果。役が成立する解釈が無ければ Err
 */
export function calculateScoreForTehai(
  tehai: Tehai14,
  config: Readonly<ScoreCalculationConfig>,
): Result<ScoreResult, NoYakuError> {
  const context = createScoreContext(tehai, config);

  const interpretation = selectHouraInterpretation(
    tehai,
    context,
    config.ruleConfig,
  );
  if (interpretation === undefined) {
    return err(new NoYakuError());
  }

  const result = calculateScoreFromHanAndFu(
    interpretation.yakuHansu,
    interpretation.fuResult,
    interpretation.dora,
    context,
    interpretation.yakumanMultiplier,
    config.ruleConfig,
  );

  // 利用側が符の内訳を表示する際にライブラリと同じ構造解釈を参照できるよう、
  // 採用した構造に紐づく詳細情報を含めて返す。
  const detail: ScoreDetail = {
    structure: interpretation.structure,
    machiType: interpretation.machiType,
    fuResult: interpretation.fuResult,
    yakuResult: interpretation.yakuResult,
  };

  return ok({ ...result, detail });
}
