import { type Tehai14, HaiKind } from "../../types";
import { NoYakuError } from "../../errors";
import { countDora } from "../../core/dora";
import { classifyMachi } from "../../core/machi";
import {
  getHouraStructures,
  detectYakuForStructure,
  selectBestInterpretation,
} from "../yaku";
import { calculateFu } from "./lib/fu";
import { isMenzen } from "../yaku/utils";
import { calculateScoreFromHanAndFu, getPaymentTotal } from "./lib/calculation";
import {
  ScoreLevel,
  type ScoreCalculationConfig,
  type ScoreContext,
  type ScoreResult,
  type ScoreDetail,
} from "./types";

export type {
  ScoreCalculationConfig,
  ScoreResult,
  ScoreDetail,
  Payment,
  Ron,
  KoTsumo,
  OyaTsumo,
  FuRuleConfig,
} from "./types";
export { ScoreLevel };

// 点数の純粋計算ロジック（公開API・テスト用に再エクスポート）
export {
  calculateBasePoints,
  getScoreLevel,
  getPaymentTotal,
  calculateScoreFromHanAndFu,
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
    ...(config.uraDoraMarkers ? { uraDoraMarkers: config.uraDoraMarkers } : {}),
  };
}

/**
 * 手牌とコンテキストから点数を計算する（公開API）
 *
 * 手牌の構造解析を行い、最も高点となる解釈を採用して点数を返します。
 *
 * 注: 同一手牌で「翻数が高いが符が低い解釈」と「翻数が低いが符が高い解釈」が
 * 両立するケースは実質的に存在しないため、翻数最大の解釈を採用しています。
 *
 * @param tehai 手牌 (14枚)
 * @param config 点数計算の設定 (場風、自風、ドラなど)
 * @returns 点数計算結果
 */
export function calculateScoreForTehai(
  tehai: Tehai14,
  config: Readonly<ScoreCalculationConfig>,
): ScoreResult {
  const context = createScoreContext(tehai, config);
  const structuralInterpretations = getHouraStructures(tehai);

  // 全ての構造解釈のうち、最も高得点となる解釈を採用する。
  const bestResult = selectBestInterpretation(
    structuralInterpretations,
    (hand) => {
      // 1. 役の判定
      const yakuResult = detectYakuForStructure(hand, context);
      const yakuHansu = yakuResult.reduce((sum, [, han]) => sum + han, 0);

      // 役がない場合はこの構造は不成立（スキップ）
      if (yakuHansu === 0) return undefined;

      // 2. 符の計算
      const isPinfu = yakuResult.some(([name]) => name === "Pinfu");
      const fuResult = calculateFu(hand, context, isPinfu, config.ruleConfig);

      // 3. ドラの計算
      const dora = countDora(tehai, context.doraMarkers);

      // 4. 点数計算
      const result = calculateScoreFromHanAndFu(
        yakuHansu,
        fuResult,
        dora,
        context,
      );
      const total = getPaymentTotal(result.payment);

      // 利用側が符の内訳を表示する際にライブラリと同じ構造解釈を参照できるよう、
      // 採用した構造に紐づく詳細情報を value に含める。
      const machiType = classifyMachi(hand, context.agariHai);
      const detail: ScoreDetail = {
        structure: hand,
        machiType,
        fuResult,
        yakuResult,
      };

      return { score: total, value: { ...result, detail } };
    },
  );

  if (!bestResult) {
    throw new NoYakuError();
  }

  return bestResult;
}
