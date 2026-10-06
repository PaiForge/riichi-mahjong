import { type Result, ok, err } from "neverthrow";
import { type Tehai14, HaiKind } from "../../types";
import { NoYakuError } from "../../errors";
import { rankHouraInterpretations } from "../houra";
import { toHouraContext } from "../yaku/utils";
import { calculateScoreFromHanAndFu } from "./lib/calculation";
import {
  ScoreLevel,
  type RankedScoreResult,
  type ScoreCalculationConfig,
  type ScoreContext,
  type ScoreDetail,
} from "./types";

export type {
  ScoreCalculationConfig,
  CalculateScoreConfig,
  ScoreResult,
  RankedScoreResult,
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
    ...toHouraContext(tehai, config),
    isOya: config.jikaze === HaiKind.Ton,
  };
}

/**
 * 手牌の和了解釈ごとの点数を高点法の順に並べて返す（公開API）
 *
 * 同じ牌姿でも「面子分解 × 和了牌の置き場所」の組み合わせで和了解釈は
 * 複数ありうる（例: 345m 345m 55m の 5m は雀頭の単騎とも順子の両面とも
 * 取れる）。成立する和了（役が 1 つ以上ある解釈）の点数をすべて計算し、
 * 高点法（基本点 → 翻数 → 符の降順。{@link compareHouraRankingKeys}）に
 * 並べて返す。先頭が `calculateScoreForTehai` の採用する解釈。
 *
 * - 役が成立しない解釈は和了ではないため含めない。成立する和了が無ければ
 *   空配列
 * - 面子の並びだけが違う分解や、同じ面子への置き場所は 1 つにまとめる。
 *   役・符・点数が同じでも置き場所が違う解釈は別の要素として残す
 * - 優劣がつかない解釈どうしの順序は列挙順（雀頭の牌種 → 面子分解 →
 *   置き場所）で安定している。同点の解釈は高点法上は同順位なので、先頭
 *   だけを唯一の正解として扱わないこと
 *
 * 利用側で「この手の解釈一覧」を見せる用途（面子分解の切り替え表示など）
 * のための API。各要素の `detail.structure.agari` から和了牌の位置、
 * `detail.fuResult` から符の内訳が取れる。
 *
 * @param tehai 手牌 (14枚)
 * @param config 点数計算の設定 (場風、自風、ドラなど)
 * @returns 高点法の降順に並んだ点数計算結果
 */
export function rankScoresForTehai(
  tehai: Tehai14,
  config: Readonly<ScoreCalculationConfig>,
): readonly RankedScoreResult[] {
  const context = createScoreContext(tehai, config);

  return rankHouraInterpretations(tehai, context, config.ruleConfig).map(
    (interpretation): RankedScoreResult => {
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

      return { ...result, detail };
    },
  );
}

/**
 * 手牌とコンテキストから点数を計算する（公開API）
 *
 * 手牌の構造解析を行い、高点法（最も高い点数になる解釈を採用する）で選んだ
 * 解釈の点数を返します。{@link rankScoresForTehai} の先頭と同じ値です。
 * 採用する解釈の決定は役判定（`detectYaku`）と同一の処理
 * （`rankHouraInterpretations`）で行われるため、両APIの役リスト・翻数・符が
 * 食い違うことはありません。
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
): Result<RankedScoreResult, NoYakuError> {
  const [best] = rankScoresForTehai(tehai, config);
  return best === undefined ? err(new NoYakuError()) : ok(best);
}
