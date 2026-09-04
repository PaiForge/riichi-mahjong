import type { Tehai14 } from "../../types";
import type { YakuResult, DetectYakuConfig, HouraContext } from "./types";

import { selectHouraInterpretation } from "../houra";
import { isMenzen } from "./utils";

export type {
  HouraStructure,
  YakuResult,
  YakuName,
  Hansu,
  TehaiYaku,
  YakuHanConfig,
  Yakuhai,
  DetectYakuConfig,
  YakumanRuleConfig,
} from "./types";
export * from "./lib";
export { getHouraStructures } from "./lib/structures";

/**
 * 手牌の構造役を検出する
 *
 * 同じ牌姿でも面子分解は複数ありうるため、高点法に従って採用した解釈
 * （{@link selectHouraInterpretation}）の役を返す。採用する解釈の決定は
 * 点数計算（`calculateScoreForTehai`）と同一の処理で行われるため、両者の
 * 役リスト・翻数・符が食い違うことはない。
 *
 * @param tehai 判定対象の手牌
 * @param config 役判定コンフィグ（和了牌、場風、自風、ドラ表示牌など）
 * @returns 成立した役と翻数のリスト（高点法で採用した解釈の結果）
 */
export function detectYaku(
  tehai: Tehai14,
  config: DetectYakuConfig,
): YakuResult {
  const context: HouraContext = {
    isMenzen: isMenzen(tehai),
    agariHai: config.agariHai,
    bakaze: config.bakaze,
    jikaze: config.jikaze,
    doraMarkers: config.doraMarkers ?? [],
    uraDoraMarkers: config.uraDoraMarkers ?? [],
    isTsumo: config.isTsumo,
    yakumanRuleConfig: config.ruleConfig,
  };

  const interpretation = selectHouraInterpretation(
    tehai,
    context,
    config.ruleConfig,
  );

  return interpretation?.yakuResult ?? [];
}
