import type {
  Tehai14,
  YakuResult,
  HaiKindId,
  YakuName,
  Hansu,
} from "../../types";
import { getHouraStructures } from "./logic/structures";
import { isMenzen, isKazehai } from "./utils";
import { ALL_YAKU_DEFINITIONS } from "./logic/definitions";
import type { HouraContext } from "./types";

export type { HouraStructure } from "./types";
export * from "./logic";

/**
 * 手牌の構造役を検出する
 *
 * @param tehai 判定対象の手牌
 * @param agariHai 和了牌
 * @returns 成立した役と飜数のリスト（最も高得点となる解釈の結果）
 */
export function detectYakuFromTehai(
  tehai: Tehai14,
  agariHai: HaiKindId,
  bakaze?: HaiKindId,
  jikaze?: HaiKindId,
): YakuResult {
  // 1. 基本情報の抽出
  const isMenzenValue = isMenzen(tehai);

  const context: HouraContext = {
    isMenzen: isMenzenValue,
    agariHai,
    bakaze: bakaze !== undefined && isKazehai(bakaze) ? bakaze : undefined,
    jikaze: jikaze !== undefined && isKazehai(jikaze) ? jikaze : undefined,
  };

  let bestResult: YakuResult = [];
  let maxHan = -1;

  // 2. 手牌の構造分解（面子手、七対子、国士無双）と役判定
  const structuralInterpretations = getHouraStructures(tehai);

  for (const hand of structuralInterpretations) {
    const currentResult: [YakuName, Hansu][] = [];
    let currentHan = 0;

    for (const definition of ALL_YAKU_DEFINITIONS) {
      if (definition.isSatisfied(hand, context)) {
        const hansu = definition.getHansu(hand, context);
        // 喰い下がり0の場合は不成立 (getHansuが0を返すはずだが念のため)
        if (hansu === 0) continue;

        // TODO: 役牌のダブル役（ダブ東など）の場合、現状の YakuhaiDefinition は Han * count を返すが、
        // YakuResult の形式としては [Name, TotalHan] なのか [Name, Han], [Name, Han] なのか議論が必要。
        // 現状の実装: [checker.yaku.name, hanValue] を count 回 push していた。
        // 新しい getHansu は total han を返すため、1回 push すればよいのか？
        // しかし役の数え方としては「役牌：白」「役牌：發」は別だが、「ダブ東」は「役牌：東」が2つ？
        // 一般的には「自風 東」「場風 東」という2つの役扱い。
        // しかしここでは YakuhaiDefinition が汎用的になっている。
        // ユーザー要望の simple refactor に従い、getHansu が返す値をそのまま1つの役として扱う。
        // ただし Yakuhai の getHansu は (open * count) を返しているので、
        // ダブ東なら 2飜 の役が1つ、という扱いになる。
        currentResult.push([definition.yaku.name, hansu]);
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        currentHan += hansu as number;
      }
    }

    if (currentHan > maxHan) {
      maxHan = currentHan;
      bestResult = currentResult;
    }
  }

  // どの構造としても解釈できない、または役が成立しない場合は空配列
  if (maxHan === -1) {
    return [];
  }

  return bestResult;
}
