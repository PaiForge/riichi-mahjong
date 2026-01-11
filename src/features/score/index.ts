import { type Tehai14, type Fu, HaiKind } from "../../types";
import { NoYakuError } from "../../errors";
import { countDora } from "../../core/dora";
import { getHouraStructures } from "../yaku/lib/structures";
import { ALL_YAKU_DEFINITIONS } from "../yaku/lib/definitions";
import { calculateFu } from "./lib/fu";
import type { FuResult } from "./lib/fu/types";
import { isMenzen } from "../yaku/utils";
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
} from "./constants";
import {
  ScoreLevel,
  type ScoreCalculationConfig,
  type ScoreContext,
  type ScoreResult,
  type Payment,
  type Ron,
  type KoTsumo,
  type OyaTsumo,
} from "./types";
export type {
  ScoreCalculationConfig,
  ScoreResult,
  Payment,
  Ron,
  KoTsumo,
  OyaTsumo,
};
export { ScoreLevel };

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
 * @returns 基本点（Normal の場合は null）
 */
function getLimitBasePoints(level: ScoreLevel): number | null {
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
      return null;
  }
}

/**
 * 点数計算用コンテキストを作成する
 *
 * @param tehai 手牌 (14枚)
 * @param config 点数計算の設定
 * @returns 点数計算用コンテキスト
 */
function createScoreContext(
  tehai: Tehai14,
  config: Readonly<ScoreCalculationConfig>,
): ScoreContext {
  return {
    isMenzen: isMenzen(tehai),
    agariHai: config.agariHai,
    bakaze: config.bakaze,
    jikaze: config.jikaze,
    isTsumo: config.isTsumo,
    isOya: config.jikaze === HaiKind.Ton,
    doraMarkers: config.doraMarkers,
    ...(config.uraDoraMarkers ? { uraDoraMarkers: config.uraDoraMarkers } : {}),
  };
}

/**
 * 手牌とコンテキストから点数を計算する（公開API）
 *
 * 手牌の構造解析を行い、最も高点となる解釈を採用して点数を返します。
 *
 * @param tehai 手牌 (14枚)
 * @param config 点数計算の設定 (場風、自風、ドラなど)
 * @returns 点数計算結果
 */
export function calculateScoreForTehai(
  tehai: Tehai14,
  config: Readonly<ScoreCalculationConfig>,
): ScoreResult {
  const context = createScoreContext(tehai, config);
  const structuralInterpretations = getHouraStructures(tehai);
  let bestResult: ScoreResult | null = null;
  let maxTotalPoints = -1;

  for (const hand of structuralInterpretations) {
    // 1. 役の判定
    let yakuHansu = 0;
    let isPinfu = false;

    for (const definition of ALL_YAKU_DEFINITIONS) {
      if (definition.isSatisfied(hand, context)) {
        const h = definition.getHansu(hand, context);
        if (h > 0) {
          yakuHansu += h;
          if (definition.yaku.name === "Pinfu") {
            isPinfu = true;
          }
        }
      }
    }

    // 役がない場合はこの構造は不成立
    if (yakuHansu === 0) continue;

    // 2. 符の計算
    const fuResult = calculateFu(hand, context, isPinfu);

    // 3. ドラの計算
    // context.doraMarkers にドラ表示牌が入っている前提
    const dora = countDora(tehai, context.doraMarkers);

    // 4. 点数計算 (基本計算)
    const result = calculateScoreFromHanAndFu(
      yakuHansu,
      fuResult,
      dora,
      context,
    );
    const total = getPaymentTotal(result.payment);

    if (total > maxTotalPoints) {
      maxTotalPoints = total;
      bestResult = result;
    }
  }

  if (!bestResult) {
    throw new NoYakuError();
  }

  return bestResult;
}

/**
 * 基本的な点数計算ロジック (内部用・テスト用)
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
