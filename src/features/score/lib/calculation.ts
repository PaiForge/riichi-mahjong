import type {
  Fu,
  RuleConfig,
  ScoreLevelRuleConfig,
  YakumanRuleConfig,
} from "../../../types";
import type { Hansu, YakuName } from "../../yaku/types";
import type { FuResult } from "./fu/types";
import {
  BASE_SCORE_KIRIAGE_MANGAN,
  BASE_SCORE_LIMIT,
  HAN_BAIMAN,
  HAN_HANEMAN,
  HAN_MANGAN,
  HAN_SANBAIMAN,
  HAN_YAKUMAN,
  SCORE_BASE_BAIMAN,
  SCORE_BASE_HANEMAN,
  SCORE_BASE_MANGAN,
  SCORE_BASE_SANBAIMAN,
  SCORE_BASE_YAKUMAN,
} from "../constants";
import {
  ScoreLevel,
  type ScoreContext,
  type ScoreResult,
  type Payment,
} from "../types";

/**
 * 100点単位で切り上げる
 */
function ceil100(points: number): number {
  return Math.ceil(points / 100) * 100;
}

/**
 * 基本点を計算する
 * 基本点 = 符 × 2^(2+翻)
 *
 * 基本点は子がツモ和了したときの他の子1人あたりの支払い点数に相当する。
 * - 子ツモ: 子の支払い = 基本点, 親の支払い = 基本点 × 2
 * - 子ロン: 支払い = 基本点 × 4
 * - 親ツモ: 各子の支払い = 基本点 × 2
 * - 親ロン: 支払い = 基本点 × 6
 */
export function calculateBasePoints(fu: Fu, han: number): number {
  return fu * Math.pow(2, 2 + han);
}

/**
 * 支払い情報から和了者が受け取る総点数を計算する
 */
export function getPaymentTotal(payment: Readonly<Payment>): number {
  switch (payment.type) {
    case "ron":
      return payment.amount;
    case "koTsumo":
      return payment.amount[0] * 2 + payment.amount[1];
    case "oyaTsumo":
      return payment.amount * 3;
  }
}

/**
 * 役満単位を算出する (YakumanMultiplier)
 *
 * 支払いが役満何個分かを、成立した役満役の集計から求める。
 * 各役満役の単位は 翻数 / 13（役満 = 1、ダブル役満 = 2）。
 *
 * - 役満役がなければ 0（数え役満もここでは 0。数え役満を役満として
 *   扱うのは {@link getScoreLevel} の役割）
 * - 複合の合算（`ruleConfig.fukugouYakuman`）が有効なら全役満の単位の合計
 * - 無効なら最高位の役満1つ分（単体で成立しているダブル役満は
 *   合算しない設定でも 2 のまま減らない）
 *
 * @param yakuResult 成立した役と翻数のリスト
 * @param ruleConfig 役満ルール設定（省略時は複合の合算なし）
 * @returns 役満単位（0 = 役満役なし）
 */
export function getYakumanMultiplier(
  yakuResult: readonly (readonly [YakuName, Hansu])[],
  ruleConfig?: Readonly<YakumanRuleConfig>,
): number {
  const units = yakuResult
    .filter(([, han]) => han >= HAN_YAKUMAN)
    .map(([, han]) => han / HAN_YAKUMAN);
  if (units.length === 0) return 0;
  return ruleConfig?.fukugouYakuman === true
    ? units.reduce((sum, unit) => sum + unit, 0)
    : Math.max(...units);
}

/**
 * 翻数と基本点から点数レベルを判定する
 *
 * 翻数ベースの区分は役満（13翻以上）が上限。数え役満は翻数がいくら
 * 積み上がっても役満止まりで、ダブル役満（DoubleYakuman）は役満単位
 * （{@link getYakumanMultiplier}）が2以上のときに点数計算側で付く区分の
 * ため、この関数からは返らない。
 *
 * @param han 翻数
 * @param basePoints 基本点（符 × 2^(2+翻)）
 * @param ruleConfig 点数区分のルール差分設定（省略時は切り上げ満貫なし）
 * @returns 点数レベル
 */
export function getScoreLevel(
  han: number,
  basePoints: number,
  ruleConfig?: Readonly<ScoreLevelRuleConfig>,
): ScoreLevel {
  // 切り上げ満貫: 30符4翻・60符3翻（基本点1920）を満貫に切り上げる
  const manganBaseScore =
    ruleConfig?.kiriageMangan === true
      ? BASE_SCORE_KIRIAGE_MANGAN
      : BASE_SCORE_LIMIT;

  if (han >= HAN_YAKUMAN) {
    return ScoreLevel.Yakuman;
  }
  if (han >= HAN_SANBAIMAN) {
    return ScoreLevel.Sanbaiman;
  }
  if (han >= HAN_BAIMAN) {
    return ScoreLevel.Baiman;
  }
  if (han >= HAN_HANEMAN) {
    return ScoreLevel.Haneman;
  }
  if (han >= HAN_MANGAN || basePoints >= manganBaseScore) {
    return ScoreLevel.Mangan;
  }
  return ScoreLevel.Normal;
}

/**
 * 点数レベルに対応する基本点を取得する
 *
 * @param level 点数レベル
 * @returns 基本点（Normal の場合は undefined）
 */
function getLimitBasePoints(level: ScoreLevel): number | undefined {
  switch (level) {
    case ScoreLevel.DoubleYakuman:
      return SCORE_BASE_YAKUMAN * 2;
    case ScoreLevel.Yakuman:
      return SCORE_BASE_YAKUMAN;
    case ScoreLevel.Sanbaiman:
      return SCORE_BASE_SANBAIMAN;
    case ScoreLevel.Baiman:
      return SCORE_BASE_BAIMAN;
    case ScoreLevel.Haneman:
      return SCORE_BASE_HANEMAN;
    case ScoreLevel.Mangan:
      return SCORE_BASE_MANGAN;
    case ScoreLevel.Normal:
      return undefined;
  }
}

/**
 * 翻数・符・役満単位から、支払いの基になる基本点と点数レベルを確定する
 *
 * 満貫以上の丸め（固定基本点）と役満単位による固定支払いを適用した後の
 * 基本点を返す。支払い点数は親／子・ロン／ツモによらずこの基本点の
 * 単調非減少な関数（{@link calculatePayment}）であるため、複数の和了解釈の
 * 優劣を比較する際は、親か子かを知らなくてもこの値で比較できる。
 *
 * @param totalHan 総翻数（役 + ドラ）
 * @param fu 符
 * @param yakumanMultiplier 役満単位（{@link getYakumanMultiplier} で算出。
 *   1 以上なら翻数・符によらず役満単位分の固定支払いになる）
 * @param ruleConfig ルール差分設定（省略時は切り上げ満貫なし）
 * @returns 基本点と点数レベル
 */
export function resolveBasePoints(
  totalHan: number,
  fu: Fu,
  yakumanMultiplier = 0,
  ruleConfig?: Readonly<ScoreLevelRuleConfig>,
): { readonly basePoints: number; readonly scoreLevel: ScoreLevel } {
  // 役満役が成立していれば、支払いは役満単位で決まる（翻数・符は使わない）
  if (yakumanMultiplier >= 1) {
    return {
      basePoints: SCORE_BASE_YAKUMAN * yakumanMultiplier,
      scoreLevel:
        yakumanMultiplier >= 2 ? ScoreLevel.DoubleYakuman : ScoreLevel.Yakuman,
    };
  }

  const rawBasePoints = calculateBasePoints(fu, totalHan);
  const scoreLevel = getScoreLevel(totalHan, rawBasePoints, ruleConfig);

  // 満貫以上なら固定の基本点、それ以外は計算値を使用
  return {
    basePoints: getLimitBasePoints(scoreLevel) ?? rawBasePoints,
    scoreLevel,
  };
}

/**
 * 翻数・符・ドラから点数（支払い情報を含む結果）を計算する純粋関数
 *
 * @param yakuHansu 役の翻数合計（ドラを含まない）
 * @param fuResult 符計算結果
 * @param dora ドラの数
 * @param context 点数計算用コンテキスト
 * @param yakumanMultiplier 役満単位（{@link getYakumanMultiplier} で算出。
 *   1 以上なら翻数・符によらず役満単位分の固定支払いになる。
 *   省略時は 0 = 役満役なしとして翻数・符から計算する）
 * @param ruleConfig ルール差分設定（省略時は切り上げ満貫なし）
 */
export function calculateScoreFromHanAndFu(
  yakuHansu: number,
  fuResult: Readonly<FuResult>,
  dora: number,
  context: Readonly<ScoreContext>,
  yakumanMultiplier = 0,
  ruleConfig?: Readonly<RuleConfig>,
): ScoreResult {
  const totalHan = yakuHansu + dora;
  const fu = fuResult.total;

  const { basePoints, scoreLevel } = resolveBasePoints(
    totalHan,
    fu,
    yakumanMultiplier,
    ruleConfig,
  );

  return {
    han: totalHan,
    fu: fu,
    scoreLevel,
    payment: calculatePayment(basePoints, context),
    yakumanMultiplier: yakumanMultiplier >= 1 ? yakumanMultiplier : 0,
  };
}

/**
 * 基本点から支払い情報を計算する
 */
function calculatePayment(
  basePoints: number,
  context: Readonly<ScoreContext>,
): Payment {
  if (context.isTsumo) {
    if (context.isOya) {
      // 親ツモ: オール (基本点 * 2)
      const allPay = ceil100(basePoints * 2);
      return { type: "oyaTsumo", amount: allPay };
    } else {
      // 子ツモ: 親の支払い = 基本点 * 2, 子の支払い = 基本点 * 1
      const parentPay = ceil100(basePoints * 2);
      const childPay = ceil100(basePoints * 1);
      return { type: "koTsumo", amount: [childPay, parentPay] };
    }
  } else {
    // ロン和了
    if (context.isOya) {
      // 親ロン: 基本点 * 6
      const pay = ceil100(basePoints * 6);
      return { type: "ron", amount: pay };
    } else {
      // 子ロン: 基本点 * 4
      const pay = ceil100(basePoints * 4);
      return { type: "ron", amount: pay };
    }
  }
}
