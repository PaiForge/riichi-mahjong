import type { Tehai14 } from "../../types";
import type { DetectYakuConfig, HouraContext } from "./types";

/**
 * 手牌が門前（メンゼン）かどうかを判定する。
 *
 * 門前の定義:
 * - 明刻、明順、明槓などの「晒し」が含まれていないこと。
 * - 暗槓は門前として扱う。
 *
 * @param tehai 判定対象の手牌
 * @returns 門前であれば true、そうでなければ false
 */
export function isMenzen(tehai: Tehai14): boolean {
  // exposed（副露ブロック）が空なら門前
  if (tehai.exposed.length === 0) {
    return true;
  }

  // 副露ブロックがある場合、全てが「暗槓」であれば門前とみなす
  // 暗槓の定義: typeが"Kantsu"かつfuro情報を持たない（現状のデータ構造における定義）
  return tehai.exposed.every((m) => {
    return m.type === "Kantsu" && !m.furo;
  });
}

/**
 * 役判定コンフィグから和了コンテキスト (HouraContext) を組み立てる。
 *
 * 門前かどうかは手牌から導出し、ルール設定は役満ルール設定としてそのまま渡す
 * （`RuleConfig` は `YakumanRuleConfig` を内包する）。役判定（`detectYaku`）と
 * 点数計算（`calculateScoreForTehai`）で同じ写像を使うことで、両APIが異なる
 * コンテキストで解釈を選ぶことを防ぐ。
 *
 * @param tehai 判定対象の手牌
 * @param config 役判定コンフィグ（点数計算コンフィグはその拡張）
 * @returns 和了コンテキスト
 */
export function toHouraContext(
  tehai: Tehai14,
  config: DetectYakuConfig,
): HouraContext {
  return {
    isMenzen: isMenzen(tehai),
    agariHai: config.agariHai,
    bakaze: config.bakaze,
    jikaze: config.jikaze,
    doraMarkers: config.doraMarkers ?? [],
    isTsumo: config.isTsumo,
    yakumanRuleConfig: config.ruleConfig,
  };
}
