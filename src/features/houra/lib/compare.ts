import type { Fu } from "../../../types";

/**
 * 和了解釈の比較キー (HouraRankingKey)
 *
 * 高点法で解釈の優劣を決めるために必要な値のみを取り出したもの。
 */
export interface HouraRankingKey {
  /**
   * 基本点（満貫以上の丸め・役満単位を適用した後の値）
   *
   * 支払い点数は親／子・ロン／ツモによらず基本点の単調非減少な関数であるため、
   * 基本点で比較すれば「支払いが最大の解釈」を選べる。
   */
  readonly basePoints: number;
  /** 総翻数（役 + ドラ） */
  readonly han: number;
  /** 符 */
  readonly fu: Fu;
}

/**
 * 高点法の規則で2つの和了解釈を比較する (compareHouraRankingKeys)
 *
 * 比較は「点数（基本点） → 翻数 → 符」の辞書式で行う。
 *
 * - 点数が最大の解釈を採用するのが高点法の原則。
 * - 点数が同じ場合は翻数の高い方を採る（一般的な慣習。例: 2翻30符と1翻60符は
 *   同じ2000点だが、2翻30符を採用する）。
 * - 翻数まで同じ場合は符の高い方を採る。ここまで一致すれば表示上の内訳も
 *   一致するため、以降の順序は面子分解の列挙順に委ねてよい。
 *
 * 比較を一箇所に固定することで、採用する解釈が呼び出し元によって変わったり、
 * 面子分解の列挙順という実装詳細に依存したりすることを防ぐ。
 *
 * @param a 比較対象の解釈のキー
 * @param b 比較対象の解釈のキー
 * @returns a が優れていれば正、b が優れていれば負、優劣がつかなければ 0
 */
export function compareHouraRankingKeys(
  a: Readonly<HouraRankingKey>,
  b: Readonly<HouraRankingKey>,
): number {
  if (a.basePoints !== b.basePoints) return a.basePoints - b.basePoints;
  if (a.han !== b.han) return a.han - b.han;
  return a.fu - b.fu;
}
