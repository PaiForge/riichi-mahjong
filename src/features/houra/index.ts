import type { HouraStructure, RuleConfig, Tehai14 } from "../../types";
import type { HouraContext } from "../yaku/types";
import type { HouraInterpretation } from "./types";
import type { HouraRankingKey } from "./lib/compare";

import { countDora } from "../../core/dora";
import { classifyMachi } from "../../core/machi";
import { getHouraStructures } from "../yaku/lib/structures";
import { detectYakuForStructure, getYakuHansu } from "../yaku/lib/detect";
import { calculateFu } from "../score/lib/fu";
import {
  getYakumanMultiplier,
  resolveBasePoints,
} from "../score/lib/calculation";
import { compareHouraRankingKeys } from "./lib/compare";

export type { HouraInterpretation } from "./types";
export type { HouraRankingKey } from "./lib/compare";
export { compareHouraRankingKeys } from "./lib/compare";

/**
 * 評価済みの和了解釈。高点法の比較キーを添えたもの。
 */
interface RankedInterpretation {
  readonly interpretation: HouraInterpretation;
  readonly key: HouraRankingKey;
}

/**
 * 1つの和了構造を評価し、解釈と高点法の比較キーを組み立てる (evaluateHouraStructure)
 *
 * 役が一つも成立しない構造は和了として成立しないため undefined を返す。
 * 構造ごとの評価（役・符・基本点）をここに閉じ込め、どの解釈を採用するかの
 * 判断（{@link selectHouraInterpretation}）から切り離す。
 *
 * @param structure 評価する和了構造
 * @param context 和了コンテキスト
 * @param dora ドラの数（構造によらず一定なので呼び出し側で数える）
 * @param ruleConfig ルール差分設定（任意）
 * @returns 評価済みの解釈。役が無ければ undefined
 */
function evaluateHouraStructure(
  structure: HouraStructure,
  context: Readonly<HouraContext>,
  dora: number,
  ruleConfig?: Readonly<RuleConfig>,
): RankedInterpretation | undefined {
  const yakuResult = detectYakuForStructure(structure, context);
  const yakuHansu = getYakuHansu(yakuResult);

  // 役なしの解釈は和了として成立しないため候補にしない
  if (yakuHansu === 0) return undefined;

  const isPinfu = yakuResult.some(([name]) => name === "Pinfu");
  const fuResult = calculateFu(structure, context, isPinfu, ruleConfig);
  const yakumanMultiplier = getYakumanMultiplier(
    yakuResult,
    context.yakumanRuleConfig,
  );
  const { basePoints } = resolveBasePoints(
    yakuHansu + dora,
    fuResult.total,
    yakumanMultiplier,
    ruleConfig,
  );

  return {
    interpretation: {
      structure,
      yakuResult,
      yakuHansu,
      dora,
      fuResult,
      machiType: classifyMachi(structure, context.agariHai),
      yakumanMultiplier,
    },
    key: { basePoints, han: yakuHansu + dora, fu: fuResult.total },
  };
}

/**
 * 手牌から採用する和了解釈を決定する (selectHouraInterpretation)
 *
 * 同じ牌姿でも面子分解は複数ありうるため、高点法
 * （{@link compareHouraRankingKeys} の規則）に従って1つの解釈を採用する。
 * 役が一つも成立しない解釈は和了として成立しないため候補から除外する。
 *
 * 「どの解釈を採用するか」の判断はこの関数に集約されており、役判定
 * （`detectYaku`）と点数計算（`calculateScoreForTehai`）は、いずれもこの
 * 関数が返した解釈から必要な情報を取り出すだけである。両者が別々の評価軸で
 * 解釈を選ぶと、同じ手牌に対して役リスト・翻数・符が食い違うため。
 *
 * @param tehai 手牌 (14枚)
 * @param context 和了コンテキスト（和了牌、場風、自風、ドラ表示牌など）
 * @param ruleConfig ルール差分設定（任意）。符や点数区分のルールは解釈の優劣に
 *   影響するため、役判定時にも点数計算時と同じ設定を渡す必要がある
 * @returns 採用された和了解釈。役のある解釈が一つも無ければ undefined
 */
export function selectHouraInterpretation(
  tehai: Tehai14,
  context: Readonly<HouraContext>,
  ruleConfig?: Readonly<RuleConfig>,
): HouraInterpretation | undefined {
  // ドラは面子分解によらず一定のため、解釈ごとに数え直さない
  const dora = countDora(tehai, context.doraMarkers);

  const candidates = getHouraStructures(tehai).flatMap((structure) => {
    const ranked = evaluateHouraStructure(structure, context, dora, ruleConfig);
    return ranked === undefined ? [] : [ranked];
  });

  // 優劣がつかない場合は先に列挙された解釈を維持する
  const best = candidates.reduce<RankedInterpretation | undefined>(
    (current, candidate) =>
      current === undefined ||
      compareHouraRankingKeys(candidate.key, current.key) > 0
        ? candidate
        : current,
    undefined,
  );

  return best?.interpretation;
}
