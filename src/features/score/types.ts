import type { Fu, HaiKindId, Kazehai } from "../../types";
import type { HouraContext } from "../yaku/types";

/**
 * 点数計算用コンテキスト (ScoreContext)
 *
 * HouraContext を拡張し、点数計算に必要な追加情報を持つ。
 *
 * HouraContext は役判定に特化しており、isOya は役の成立・翻数に影響しない。
 * isOya は支払い計算（親ロン/子ロン、親ツモ/子ツモの倍率差）にのみ必要なため、
 * 点数計算用のコンテキストとして分離している。
 */
export interface ScoreContext extends HouraContext {
  /** 和了者が親かどうか */
  readonly isOya: boolean;
}

export interface ScoreCalculationConfig {
  /** 和了牌 */
  agariHai: HaiKindId;
  /** ツモ和了かどうか (必須) */
  isTsumo: boolean;
  /** 自風 (必須) */
  jikaze: Kazehai;
  /** 場風 (必須) */
  bakaze: Kazehai;
  /** ドラ表示牌 (必須、なければ空配列) */
  doraMarkers: readonly HaiKindId[];
  /** 裏ドラ表示牌 (任意) */
  uraDoraMarkers?: readonly HaiKindId[];
}

/** ロン和了時の支払い */
export interface Ron {
  type: "ron";
  /** 振り込んだプレイヤーが支払う点数 */
  amount: number;
}

/** 子のツモ和了時の支払い */
export interface KoTsumo {
  type: "koTsumo";
  /** [子の支払い, 親の支払い] */
  readonly amount: readonly [number, number];
}

/** 親のツモ和了時の支払い */
export interface OyaTsumo {
  type: "oyaTsumo";
  /** 子全員が支払う点数（オール） */
  amount: number;
}

/** 支払い情報 */
export type Payment = Ron | KoTsumo | OyaTsumo;

/**
 * 点数レベル (ScoreLevel)
 *
 * 翻数と基本点から決まる点数の区分。
 * 満貫以上では符に関係なく固定の基本点が適用される。
 */
export const ScoreLevel = {
  /** 満貫未満（通常計算） */
  Normal: "Normal",
  /** 満貫（5翻、または基本点2000以上） */
  Mangan: "Mangan",
  /** 跳満（6-7翻） */
  Haneman: "Haneman",
  /** 倍満（8-10翻） */
  Baiman: "Baiman",
  /** 三倍満（11-12翻） */
  Sanbaiman: "Sanbaiman",
  /** 役満（13翻以上） */
  Yakuman: "Yakuman",
  /** ダブル役満（26翻以上、または役満複合） */
  DoubleYakuman: "DoubleYakuman",
} as const;

export type ScoreLevel = (typeof ScoreLevel)[keyof typeof ScoreLevel];

export interface ScoreResult {
  han: number;
  fu: Fu;
  scoreLevel: ScoreLevel;
  payment: Payment;
}
