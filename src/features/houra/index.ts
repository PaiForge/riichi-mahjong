import type {
  HouraDecomposition,
  HouraStructure,
  RuleConfig,
  Tehai14,
} from "../../types";
import type { HouraContext } from "../yaku/types";
import type { HouraInterpretation } from "./types";
import type { HouraRankingKey } from "./lib/compare";

import { countDora } from "../../core/dora";
import { expandAgariPlacements } from "../../core/agari";
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
 * 分解を和了構造に展開する。
 *
 * 面子手は和了牌の置き場所ごとに 1 つの和了構造になる（置き場所が複数ある
 * 手は複数の候補に分かれる）。七対子・国士無双は置き場所で役・符が変わらない
 * ため、そのまま 1 つの和了構造。和了牌が手牌に無い入力は和了形にならず、
 * 候補を生まない。
 */
function expandToStructures(
  decomposition: HouraDecomposition,
  agariHai: HouraContext["agariHai"],
): readonly HouraStructure[] {
  return decomposition.type === "Mentsu"
    ? expandAgariPlacements(decomposition, agariHai)
    : [decomposition];
}

/**
 * 1つの和了構造を評価し、解釈と高点法の比較キーを組み立てる (evaluateHouraStructure)
 *
 * 役が一つも成立しない構造は和了として成立しないため undefined を返す。
 * 構造ごとの評価（役・符・基本点）をここに閉じ込め、どの解釈を採用するかの
 * 判断（{@link rankHouraInterpretations}）から切り離す。
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
      machiType: classifyMachi(structure),
      yakumanMultiplier,
    },
    key: { basePoints, han: yakuHansu + dora, fu: fuResult.total },
  };
}

/**
 * 手牌の和了解釈を高点法の順に並べて返す (rankHouraInterpretations)
 *
 * 解釈は「面子分解 × 和了牌の置き場所」の組み合わせで、同じ牌姿でも複数
 * ありうる。すべてを評価し、高点法（{@link compareHouraRankingKeys} の規則）
 * の降順に並べる。役が一つも成立しない解釈は和了として成立しないため含めない。
 * 優劣がつかない解釈どうしは列挙順（雀頭の牌種 → 面子分解 → 置き場所）を
 * 維持する。
 *
 * 「どの解釈を採用するか」の判断はこの関数に集約されており、役判定
 * （`detectYaku`）と点数計算（`calculateScoreForTehai`）は、いずれもこの
 * 関数が返した先頭の解釈から必要な情報を取り出すだけである。両者が別々の
 * 評価軸で解釈を選ぶと、同じ手牌に対して役リスト・翻数・符が食い違うため。
 *
 * @param tehai 手牌 (14枚)
 * @param context 和了コンテキスト（和了牌、場風、自風、ドラ表示牌など）
 * @param ruleConfig ルール差分設定（任意）。符や点数区分のルールは解釈の優劣に
 *   影響するため、役判定時にも点数計算時と同じ設定を渡す必要がある
 * @returns 高点法の降順に並んだ和了解釈。役のある解釈が無ければ空配列
 */
export function rankHouraInterpretations(
  tehai: Tehai14,
  context: Readonly<HouraContext>,
  ruleConfig?: Readonly<RuleConfig>,
): readonly HouraInterpretation[] {
  // ドラは面子分解によらず一定のため、解釈ごとに数え直さない
  const dora = countDora(tehai, context.doraMarkers);

  const candidates = getHouraStructures(tehai)
    .flatMap((decomposition) =>
      expandToStructures(decomposition, context.agariHai),
    )
    .flatMap((structure) => {
      const ranked = evaluateHouraStructure(
        structure,
        context,
        dora,
        ruleConfig,
      );
      return ranked === undefined ? [] : [ranked];
    });

  // Array.prototype.sort は安定なので、優劣がつかない候補は列挙順のまま並ぶ
  return [...candidates]
    .sort((a, b) => compareHouraRankingKeys(b.key, a.key))
    .map((ranked) => ranked.interpretation);
}

/**
 * 手牌から採用する和了解釈を決定する (selectHouraInterpretation)
 *
 * {@link rankHouraInterpretations} の先頭、すなわち高点法で最も高い解釈。
 *
 * @param tehai 手牌 (14枚)
 * @param context 和了コンテキスト（和了牌、場風、自風、ドラ表示牌など）
 * @param ruleConfig ルール差分設定（任意）
 * @returns 採用された和了解釈。役のある解釈が一つも無ければ undefined
 */
export function selectHouraInterpretation(
  tehai: Tehai14,
  context: Readonly<HouraContext>,
  ruleConfig?: Readonly<RuleConfig>,
): HouraInterpretation | undefined {
  return rankHouraInterpretations(tehai, context, ruleConfig)[0];
}
