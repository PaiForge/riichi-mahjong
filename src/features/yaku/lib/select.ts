import type { HouraStructure } from "../types";

/**
 * 複数の和了構造解釈の中から、評価値が最大となる解釈を選ぶ。
 *
 * 麻雀の手牌は同じ牌姿でも複数の面子構成に解釈できる（多義性）ため、利用側は
 * 「最大翻」「最大点」など目的に応じた評価関数で最良の解釈を選ぶ必要がある。
 * 本関数はその選択骨格（全解釈を走査し最大スコアを保持する処理）を共通化する。
 *
 * @param structures 和了構造の解釈リスト
 * @param evaluate 各解釈を評価する関数。スコアと値を返す。解釈が不成立の
 *   場合は undefined を返すとスキップされる。
 * @returns 最大スコアの解釈の値。該当が無ければ undefined。
 */
export function selectBestInterpretation<T>(
  structures: readonly HouraStructure[],
  evaluate: (
    hand: HouraStructure,
  ) => { readonly score: number; readonly value: T } | undefined,
): T | undefined {
  let best: T | undefined;
  let maxScore = -Infinity;

  for (const hand of structures) {
    const evaluated = evaluate(hand);
    if (evaluated === undefined) continue;
    if (evaluated.score > maxScore) {
      maxScore = evaluated.score;
      best = evaluated.value;
    }
  }

  return best;
}
