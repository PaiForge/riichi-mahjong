import type { Tehai14 } from "../../types";
import type { HouraContext } from "../yaku/types";
import type { FuRuleConfig } from "../score/lib/fu/types";
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
 * @param fuRuleConfig 符計算のルール差分設定（任意）。符は解釈の優劣に影響する
 *   ため、役判定時にも点数計算時と同じ設定を渡す必要がある
 * @returns 採用された和了解釈。役のある解釈が一つも無ければ undefined
 */
export function selectHouraInterpretation(
  tehai: Tehai14,
  context: Readonly<HouraContext>,
  fuRuleConfig?: Readonly<FuRuleConfig>,
): HouraInterpretation | undefined {
  // ドラは面子分解によらず一定のため、解釈ごとに数え直さない
  const dora = countDora(tehai, context.doraMarkers);

  let best: HouraInterpretation | undefined;
  let bestKey: HouraRankingKey | undefined;

  for (const structure of getHouraStructures(tehai)) {
    const yakuResult = detectYakuForStructure(structure, context);
    const yakuHansu = getYakuHansu(yakuResult);

    // 役なしの解釈は和了として成立しないため候補にしない
    if (yakuHansu === 0) continue;

    const isPinfu = yakuResult.some(([name]) => name === "Pinfu");
    const fuResult = calculateFu(structure, context, isPinfu, fuRuleConfig);
    const yakumanMultiplier = getYakumanMultiplier(
      yakuResult,
      context.yakumanRuleConfig,
    );
    const { basePoints } = resolveBasePoints(
      yakuHansu + dora,
      fuResult.total,
      yakumanMultiplier,
    );

    const key: HouraRankingKey = {
      basePoints,
      han: yakuHansu + dora,
      fu: fuResult.total,
    };
    if (bestKey !== undefined && compareHouraRankingKeys(key, bestKey) <= 0) {
      continue;
    }

    best = {
      structure,
      yakuResult,
      yakuHansu,
      dora,
      fuResult,
      machiType: classifyMachi(structure, context.agariHai),
      yakumanMultiplier,
    };
    bestKey = key;
  }

  return best;
}
