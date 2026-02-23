import type { Fu, HaiKindId, Kazehai } from "../../types";
import type { HouraContext, HouraStructure, YakuResult } from "../yaku/types";
import type { MachiType } from "../../core/machi";
import type { FuResult } from "./lib/fu/types";

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

/**
 * 点数計算で選択された構造解釈の詳細情報 (ScoreDetail)
 *
 * calculateScoreForTehai が最高得点として選択した構造解釈に紐づく情報。
 *
 * 同一手牌でも面子分解（構造解釈）によって待ちの形が変わり、
 * 結果として符・得点が異なる場合がある。
 * ライブラリは内部で最高得点の構造を選択するが、その選択結果を
 * 利用側に公開しないと、利用側が独自に構造を解釈した際にライブラリと
 * 異なる符の内訳を表示してしまうバグが発生する。
 *
 * このインターフェースにより、利用側はライブラリが採用した構造解釈と
 * 完全に一致する符の内訳を表示できる。
 */
export interface ScoreDetail {
  /** ライブラリが最高得点として選択した和了構造（面子分解） */
  readonly structure: HouraStructure;
  /**
   * 選択された構造における待ちの形
   *
   * 面子手の場合のみ判定される。七対子・国士無双の場合は undefined。
   * 同じアガリ牌が順子と雀頭の両方に含まれる場合、符が高くなる
   * 待ち形（例: 両面より単騎）が採用される。
   */
  readonly machiType: MachiType | undefined;
  /**
   * 選択された構造に基づく符計算の内訳
   *
   * total は最終的な符数（10符単位切り上げ）、details は各構成要素の符。
   * 利用側で符の内訳を表示する際は、この値をそのまま使用すること。
   */
  readonly fuResult: FuResult;
  /** 成立した役と翻数のリスト（ドラを含まない） */
  readonly yakuResult: YakuResult;
}

export interface ScoreResult {
  han: number;
  fu: Fu;
  scoreLevel: ScoreLevel;
  payment: Payment;
  /**
   * ライブラリが最高得点として選択した構造解釈の詳細情報
   *
   * 手牌には複数の面子分解が存在しうるが、ライブラリ内部で最高得点の
   * 構造が選択される。この選択結果を外部に公開しないと、利用側で
   * 符の内訳を正確に表示できないため追加された。
   *
   * 利用側で符の内訳や待ちの形を表示する際は、独自に構造解釈を行わず、
   * このフィールドの値をそのまま使用すること。
   */
  detail?: ScoreDetail;
}
