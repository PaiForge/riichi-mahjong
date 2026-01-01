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

export type ScoreLevel =
  | "Normal"
  | "Mangan" // 満貫: 5飜 or 4飜30符以上
  | "Haneman" // 跳満: 6-7飜
  | "Baiman" // 倍満: 8-10飜
  | "Sanbaiman" // 三倍満: 11-12飜
  | "Yakuman" // 役満 (13飜以上 または 特殊役)
  | "DoubleYakuman" // ダブル役満
  | "TripleYakuman"; // トリプル役満 (理論上)

export interface ScorePayment {
  main: number; // ロン: 支払い総額, ツモ: 親の支払い
  sub?: number; // ツモ: 子の支払い (親のツモの場合は0 or undefined)
  total: number; // 受け取る総額
}

export interface ScoreResult {
  han: number;
  fu: number;
  level: ScoreLevel;
  points: ScorePayment;
}
