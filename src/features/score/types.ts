import type { HaiKindId, Kazehai } from "../../types";

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

export interface ScoreResult {
  han: number;
  fu: number;
  // TODO: 切り上げ満貫対応時に ScoreLevel の追加を検討
  payment: Payment;
}
