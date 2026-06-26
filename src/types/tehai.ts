import type { HaiKindId, HaiId } from "./hai";
import type { CompletedMentsu } from "./mentsu";

/**
 * 手牌 (Tehai)
 *
 * 純手牌と副露を合わせたもの。
 * @template T 牌の型 (HaiKindId | HaiId)
 */
export interface Tehai<T extends HaiKindId | HaiId = HaiKindId> {
  readonly closed: readonly T[];
  readonly exposed: readonly CompletedMentsu<T>[];
}

declare const __tehai13Brand: unique symbol;
declare const __tehai14Brand: unique symbol;

/**
 * ツモる前の手牌 (13枚)
 *
 * Branded Type により Tehai14 と型レベルで区別される。
 * 生成には createTehai13（テスト用）や assertTehai13 を使用する。
 */
export interface Tehai13<
  T extends HaiKindId | HaiId = HaiKindId,
> extends Tehai<T> {
  readonly [__tehai13Brand]: never;
}

/**
 * ツモった後の手牌 (14枚)
 *
 * Branded Type により Tehai13 と型レベルで区別される。
 * 生成には createTehai（テスト用）や assertTehai14 を使用する。
 */
export interface Tehai14<
  T extends HaiKindId | HaiId = HaiKindId,
> extends Tehai<T> {
  readonly [__tehai14Brand]: never;
}
