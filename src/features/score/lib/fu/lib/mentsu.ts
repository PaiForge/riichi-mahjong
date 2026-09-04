import type { FuResult, FuDetails, FuRuleConfig } from "../types";
import type {
  CompletedMentsu,
  Koutsu,
  MentsuHouraStructure,
  Toitsu,
} from "../../../../../types";
import type { HouraContext } from "../../../../yaku/types";
import { isSangenpai, isYaochu } from "../../../../../core/hai";
import { type Fu } from "../../../../../types";
import { classifyMachi, type MachiType } from "../../../../../core/machi";
import {
  FU_BASE,
  FU_KOUTSU,
  FU_KANTSU,
  FU_JANTOU,
  FU_MACHI,
  FU_AGARI,
  FU_PINFU_TSUMO,
  FU_OPEN_PINFU_GLAZE,
} from "../constants";

/** 面子手で取りうる符の値（10符刻み） */
const VALID_FU_VALUES: readonly Fu[] = [
  20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170,
];

/** 符の下限（副底）と上限（么九暗槓4つ + 連風牌雀頭 + 単騎 + 門前ロン） */
const FU_MIN: Fu = 20;
const FU_MAX: Fu = 170;

/**
 * 符の合計を10符単位で切り上げて Fu 型に変換する。
 *
 * 符の内訳から取りうる合計は副底20符から170符までであり、切り上げ後の値は
 * 必ず {@link VALID_FU_VALUES} に含まれる。範囲外は理論上到達しないが、
 * 全域関数とするため下限・上限に丸める。
 */
function roundUpToFu(sum: number): Fu {
  const rounded = Math.ceil(sum / 10) * 10;
  if (rounded <= FU_MIN) return FU_MIN;
  return VALID_FU_VALUES.find((fu) => fu === rounded) ?? FU_MAX;
}

/**
 * 刻子が明刻扱いになるか判定する。
 * 副露している場合に加え、ロン和了でその和了牌を含む刻子も明刻扱いとなる。
 */
function isOpenKoutsu(mentsu: Koutsu, context: HouraContext): boolean {
  if (mentsu.furo) return true;
  return !context.isTsumo && mentsu.hais.includes(context.agariHai);
}

/**
 * 面子1つの符を計算する。順子は0符。
 * 刻子・槓子は「么九牌か数牌か」×「明か暗か」で符が決まる。
 */
function calculateSingleMentsuFu(
  mentsu: CompletedMentsu,
  context: HouraContext,
): number {
  if (mentsu.type === "Shuntsu") return 0;

  const table = mentsu.type === "Koutsu" ? FU_KOUTSU : FU_KANTSU;
  const isOpen =
    mentsu.type === "Koutsu"
      ? isOpenKoutsu(mentsu, context)
      : Boolean(mentsu.furo);

  if (isYaochu(mentsu.hais[0])) {
    return isOpen ? table.YAOCHU_OPEN : table.YAOCHU_CLOSED;
  }
  return isOpen ? table.SUUPAI_OPEN : table.SUUPAI_CLOSED;
}

/**
 * 雀頭符を計算する。
 * 三元牌・場風・自風それぞれに2符加算し、連風牌（場風＝自風）は
 * ルール設定の上限（デフォルト2符、設定により4符）でキャップする。
 */
function calculateJantouFu(
  jantou: Toitsu,
  context: HouraContext,
  ruleConfig?: FuRuleConfig,
): number {
  const headHai = jantou.hais[0];

  const yakuhaiMatches =
    (isSangenpai(headHai) ? 1 : 0) +
    (headHai === context.bakaze ? 1 : 0) +
    (headHai === context.jikaze ? 1 : 0);
  const fu = yakuhaiMatches * FU_JANTOU.YAKUHAI;

  const doubleWindCap =
    ruleConfig?.doubleWindJantouFu ?? FU_JANTOU.DOUBLE_WIND_DEFAULT;
  return Math.min(fu, doubleWindCap);
}

const MACHI_FU_TABLE: Readonly<Record<MachiType, number>> = {
  Kanchan: FU_MACHI.KANCHAN,
  Penchan: FU_MACHI.PENCHAN,
  Tanki: FU_MACHI.TANKI,
  Ryanmen: FU_MACHI.RYANMEN,
  Shanpon: FU_MACHI.SHANPON,
};

/**
 * 待ち符を計算する。単騎・嵌張・辺張は2符、両面・双碰は0符。
 */
function calculateMachiFu(
  hand: MentsuHouraStructure,
  context: HouraContext,
): number {
  const machiType = classifyMachi(hand, context.agariHai);
  return machiType === undefined ? 0 : MACHI_FU_TABLE[machiType];
}

/**
 * 和了符を計算する。ツモ2符（平和は0符）、門前ロン10符。
 */
function calculateAgariFu(context: HouraContext, isPinfu: boolean): number {
  if (context.isTsumo) {
    return isPinfu ? 0 : FU_AGARI.TSUMO;
  }
  return context.isMenzen ? FU_AGARI.MENZEN_RON : 0;
}

/**
 * 符の内訳を合計し、10符単位に切り上げて最終符数を求める。
 * 喰い平和形（副露ロンで20符）は例外的に30符へ切り上げる。
 */
function roundUpFu(details: FuDetails, context: HouraContext): Fu {
  const sum =
    details.base +
    details.mentsu +
    details.jantou +
    details.machi +
    details.agari;

  if (sum === 20 && !context.isTsumo && !context.isMenzen) {
    return roundUpToFu(FU_OPEN_PINFU_GLAZE);
  }
  return roundUpToFu(sum);
}

/**
 * 面子手の符を計算する
 *
 * @param hand 面子手の構造
 * @param context 和了コンテキスト
 * @param isPinfu 平和成立フラグ
 * @param ruleConfig 符計算のルール差分設定（任意）
 */
export function calculateMentsuFu(
  hand: MentsuHouraStructure,
  context: HouraContext,
  isPinfu: boolean,
  ruleConfig?: FuRuleConfig,
): FuResult {
  const details: FuDetails = {
    base: FU_BASE.NORMAL,
    mentsu: hand.fourMentsu.reduce(
      (sum, mentsu) => sum + calculateSingleMentsuFu(mentsu, context),
      0,
    ),
    jantou: calculateJantouFu(hand.jantou, context, ruleConfig),
    machi: calculateMachiFu(hand, context),
    agari: calculateAgariFu(context, isPinfu),
  };

  // 平和ツモ例外: 内訳に関わらず20符固定
  if (isPinfu && context.isTsumo) {
    return { total: FU_PINFU_TSUMO, details };
  }

  return { total: roundUpFu(details, context), details };
}
