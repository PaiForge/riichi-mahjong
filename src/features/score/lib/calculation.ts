import type { Fu } from "../../../types";
import type { FuResult } from "./fu/types";
import {
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
 * 翻数と基本点から点数レベルを判定する
 *
 * @param han 翻数
 * @param basePoints 基本点（符 × 2^(2+翻)）
 * @returns 点数レベル
 */
export function getScoreLevel(han: number, basePoints: number): ScoreLevel {
  if (han >= 26) {
    return ScoreLevel.DoubleYakuman;
  }
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
  if (han >= HAN_MANGAN || basePoints >= BASE_SCORE_LIMIT) {
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
 * 翻数・符・ドラから点数（支払い情報を含む結果）を計算する純粋関数
 */
export function calculateScoreFromHanAndFu(
  yakuHansu: number,
  fuResult: Readonly<FuResult>,
  dora: number,
  context: Readonly<ScoreContext>,
): ScoreResult {
  const totalHan = yakuHansu + dora;
  const fu = fuResult.total;

  // 基本点の計算
  const rawBasePoints = calculateBasePoints(fu, totalHan);

  // 点数レベルの判定
  const scoreLevel = getScoreLevel(totalHan, rawBasePoints);

  // 満貫以上なら固定の基本点、それ以外は計算値を使用
  const basePoints = getLimitBasePoints(scoreLevel) ?? rawBasePoints;

  // 支払い計算
  const payment = calculatePayment(basePoints, context);

  return {
    han: totalHan,
    fu: fu,
    scoreLevel,
    payment,
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
