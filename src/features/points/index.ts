import { type Tehai14, HaiKind } from "../../types";
import { countDora } from "../../core/dora";
import { getHouraStructures } from "../yaku/lib/structures";
import { ALL_YAKU_DEFINITIONS } from "../yaku/lib/definitions";
import { calculateFu } from "./lib/fu";
import type { FuResult } from "./lib/fu/types";
import type { HouraContext } from "../yaku/types";
import { isMenzen } from "../yaku/utils";
import {
  BASE_POINT_LIMIT,
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
import type { ScoreCalculationConfig, ScoreLevel, ScoreResult } from "./types";
export type { ScoreCalculationConfig, ScoreLevel, ScoreResult };

/**
 * 100点単位で切り上げる
 */
function ceil100(points: number): number {
  return Math.ceil(points / 100) * 100;
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
  const menzen = isMenzen(tehai);
  const isOya = config.jikaze === HaiKind.Ton;

  const context: HouraContext & { isOya: boolean } = {
    isMenzen: menzen,
    agariHai: config.agariHai,
    bakaze: config.bakaze,
    jikaze: config.jikaze,
    isTsumo: config.isTsumo,
    isOya: isOya,
    doraMarkers: config.doraMarkers,
    ...(config.uraDoraMarkers ? { uraDoraMarkers: config.uraDoraMarkers } : {}),
  };

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

    if (result.points.total > maxTotalPoints) {
      maxTotalPoints = result.points.total;
      bestResult = result;
    }
  }

  if (!bestResult) {
    throw new Error("役が成立していません (No Yaku found)");
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
  context: Readonly<HouraContext & { isOya: boolean }>,
): ScoreResult {
  const totalHan = yakuHansu + dora;
  const fu = fuResult.total;

  let basePoints = fu * Math.pow(2, 2 + totalHan);
  let level: ScoreLevel = "Normal";

  // 満貫以上の判定
  // 5飜以上 は満貫確定
  // 4飜以下でも 基本点が2000を超えたら満貫 (切り上げ満貫採用なら1920->2000)
  // ここでは厳密な計算 (2000以上) とする。※30符4飜は1920なのでNormal、60符3飜は1920、70符3飜(2240)は満貫
  if (totalHan >= HAN_YAKUMAN) {
    // 役満（数え役満）
    // ダブル役満等は呼び出し元でHandを判定して Han=26 とかに固定して渡してもらう想定
    // またはHan=13以上はすべてYakumanとして扱う（シングル）
    // ここでは13以上をYakuman、26以上をDoubleとする簡易判定を入れる
    if (totalHan >= 26) {
      level = "DoubleYakuman"; // 例
      basePoints = SCORE_BASE_YAKUMAN * 2;
    } else {
      level = "Yakuman";
      basePoints = SCORE_BASE_YAKUMAN;
    }
  } else if (totalHan >= HAN_SANBAIMAN) {
    level = "Sanbaiman";
    basePoints = SCORE_BASE_SANBAIMAN;
  } else if (totalHan >= HAN_BAIMAN) {
    level = "Baiman";
    basePoints = SCORE_BASE_BAIMAN;
  } else if (totalHan >= HAN_HANEMAN) {
    level = "Haneman";
    basePoints = SCORE_BASE_HANEMAN;
  } else if (totalHan >= HAN_MANGAN || basePoints >= BASE_POINT_LIMIT) {
    level = "Mangan";
    basePoints = SCORE_BASE_MANGAN;
  }

  // 支払い計算
  let mainPayment = 0;
  let subPayment = 0;
  let totalScore = 0;

  if (context.isTsumo) {
    // ツモ和了
    if (context.isOya) {
      // 親ツモ: オール (基本点 * 2)
      const pay = ceil100(basePoints * 2);
      mainPayment = pay;

      // ScorePayment型の定義について:
      // main: ロンなら支払い総額、ツモなら親の支払い
      // sub: ツモの時の子の支払い

      // 親ツモの場合、「親の支払い」は発生せず、全員が「子」として支払います。
      // ここでは `main` を「子一人あたりの支払い」として使用します。
      // 親ツモ: 子の支払い(main) * 3
      // 子ツモ: 親の支払い(main) + 子の支払い(sub) * 2

      const childPay = ceil100(basePoints * 2);
      mainPayment = childPay; // 各子の支払い
      subPayment = 0;
      totalScore = childPay * 3;
    } else {
      // 子ツモ
      // 親の支払い: 基本点 * 2
      // 子の支払い: 基本点 * 1
      const parentPay = ceil100(basePoints * 2);
      const childPay = ceil100(basePoints * 1);
      mainPayment = parentPay;
      subPayment = childPay;
      totalScore = parentPay + childPay * 2;
    }
  } else {
    // ロン和了
    if (context.isOya) {
      // 親ロン: 基本点 * 6
      const pay = ceil100(basePoints * 6);
      mainPayment = pay;
      totalScore = pay;
    } else {
      // 子ロン: 基本点 * 4
      const pay = ceil100(basePoints * 4);
      mainPayment = pay;
      totalScore = pay;
    }
  }

  return {
    han: totalHan,
    fu: fu,
    level,
    points: {
      main: mainPayment,
      sub: subPayment,
      total: totalScore,
    },
  };
}
