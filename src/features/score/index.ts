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
import type {
  ScoreCalculationConfig,
  ScoreContext,
  ScoreResult,
  Payment,
  Ron,
  KoTsumo,
  OyaTsumo,
} from "./types";
export type {
  ScoreCalculationConfig,
  ScoreResult,
  Payment,
  Ron,
  KoTsumo,
  OyaTsumo,
};

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
export function calculateScore(
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
    const result = calculateBasicScore(yakuHansu, fuResult, dora, context);
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
export function calculateBasicScore(
  yakuHansu: number,
  fuResult: Readonly<FuResult>,
  dora: number,
  context: Readonly<ScoreContext>,
): ScoreResult {
  const totalHan = yakuHansu + dora;
  const fu = fuResult.total;

  let basePoints = calculateBasePoints(fu, totalHan);

  // 満貫以上の判定
  // 5翻以上 は満貫確定
  // 4翻以下でも 基本点が2000を超えたら満貫 (切り上げ満貫採用なら1920->2000)
  // ここでは厳密な計算 (2000以上) とする。※30符4翻は1920なのでNormal、60符3翻は1920、70符3翻(2240)は満貫
  // TODO: 切り上げ満貫対応時に ScoreLevel の追加を検討
  if (totalHan >= HAN_YAKUMAN) {
    // 役満（数え役満）
    // ダブル役満等は呼び出し元でHandを判定して Han=26 とかに固定して渡してもらう想定
    // またはHan=13以上はすべてYakumanとして扱う（シングル）
    // ここでは13以上をYakuman、26以上をDoubleとする簡易判定を入れる
    if (totalHan >= 26) {
      basePoints = SCORE_BASE_YAKUMAN * 2;
    } else {
      basePoints = SCORE_BASE_YAKUMAN;
    }
  } else if (totalHan >= HAN_SANBAIMAN) {
    basePoints = SCORE_BASE_SANBAIMAN;
  } else if (totalHan >= HAN_BAIMAN) {
    basePoints = SCORE_BASE_BAIMAN;
  } else if (totalHan >= HAN_HANEMAN) {
    basePoints = SCORE_BASE_HANEMAN;
  } else if (totalHan >= HAN_MANGAN || basePoints >= BASE_SCORE_LIMIT) {
    basePoints = SCORE_BASE_MANGAN;
  }

  // 支払い計算
  let payment: Payment;

  if (context.isTsumo) {
    if (context.isOya) {
      // 親ツモ: オール (基本点 * 2)
      const allPay = ceil100(basePoints * 2);
      payment = { type: "oyaTsumo", amount: allPay };
    } else {
      // 子ツモ
      // 親の支払い: 基本点 * 2
      // 子の支払い: 基本点 * 1
      const parentPay = ceil100(basePoints * 2);
      const childPay = ceil100(basePoints * 1);
      payment = { type: "koTsumo", amount: [childPay, parentPay] };
    }
  } else {
    // ロン和了
    if (context.isOya) {
      // 親ロン: 基本点 * 6
      const pay = ceil100(basePoints * 6);
      payment = { type: "ron", amount: pay };
    } else {
      // 子ロン: 基本点 * 4
      const pay = ceil100(basePoints * 4);
      payment = { type: "ron", amount: pay };
    }
  }

  return {
    han: totalHan,
    fu: fu,
    payment,
  };
}
