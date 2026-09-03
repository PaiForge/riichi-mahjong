import type { Tehai14 } from "../../types";
import type {
  YakuResult,
  YakuName,
  Hansu,
  HouraStructure,
  DetectYakuConfig,
} from "./types";

import { getHouraStructures } from "./lib/structures";
import { selectBestInterpretation } from "./lib/select";
import { isMenzen } from "./utils";
import { ALL_YAKU_DEFINITIONS } from "./lib/definitions";
import type { HouraContext } from "./types";

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
 * 役満の翻数閾値
 *
 * 麻雀において役満は13翻以上と定義される。
 * 数え役満（通常役の合計が13翻以上）とは異なり、
 * ここでは個々の役が単体で持つ翻数が13以上であるかを判定する基準として使用する。
 */
const YAKUMAN_HAN_THRESHOLD = 13;

/**
 * 単一の和了構造に対して役を判定する
 *
 * 役満が成立している場合、通常役は除外して役満のみを返す。
 *
 * @param hand 和了構造（面子手、七対子、国士無双のいずれか）
 * @param context 和了コンテキスト
 * @returns 成立した役と翻数のリスト
 */
export function detectYakuForStructure(
  hand: HouraStructure,
  context: HouraContext,
): YakuResult {
  const result = ALL_YAKU_DEFINITIONS.flatMap<[YakuName, Hansu]>(
    (definition) => {
      const hansu = definition.getHansu(hand, context);
      return hansu === 0 ? [] : [[definition.yaku.name, hansu]];
    },
  );

  // 一般ルール: 役満（13翻以上）が成立した場合、役満未満の通常役は複合しない。
  // 複数の役満が同時に成立した場合（例: 字一色 + 大四喜）、全ての役満を返す。
  //
  // NOTE: 複数役満の同時成立をダブル役満・トリプル役満として合算する特殊ルールには
  // 現在未対応。現在の実装では個々の役満をそのまま返しており、合算してダブル役満等
  // として扱う処理は行っていない。
  const hasYakuman = result.some(([, han]) => han >= YAKUMAN_HAN_THRESHOLD);
  if (hasYakuman) {
    return result.filter(([, han]) => han >= YAKUMAN_HAN_THRESHOLD);
  }

  return result;
}

/**
 * YakuResult から総翻数を計算する
 */
function getTotalHan(
  yakuResult: readonly (readonly [YakuName, Hansu])[],
): number {
  return yakuResult.reduce((sum, [, han]) => sum + han, 0);
}

/**
 * 手牌の構造役を検出する
 *
 * @param tehai 判定対象の手牌
 * @param config 役判定コンフィグ（和了牌、場風、自風、ドラ表示牌など）
 * @returns 成立した役と翻数のリスト（最も高得点となる解釈の結果）
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

  const structuralInterpretations = getHouraStructures(tehai);

  const best = selectBestInterpretation(structuralInterpretations, (hand) => {
    const result = detectYakuForStructure(hand, context);
    return { score: getTotalHan(result), value: result };
  });

  return best ?? [];
}
