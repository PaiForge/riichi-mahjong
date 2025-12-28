import { ShoushaiError, TahaiError } from "../errors";
import type {
  HaiId,
  HaiKindDistribution,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
} from "../types";

/**
 * 手牌の有効枚数を計算します。
 * 副露（槓子含む）は一律3枚として計算します。
 */
export function calculateTehaiCount<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): number {
  return tehai.closed.length + tehai.exposed.length * 3;
}

/**
 * 牌種ごとの枚数をカウントします。
 */
export function countHaiKind(hais: readonly HaiKindId[]): HaiKindDistribution {
  const counts = Array.from({ length: 34 }, () => 0);
  for (const hai of hais) {
    counts[hai] = (counts[hai] ?? 0) + 1;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return counts as unknown as HaiKindDistribution;
}

/**
 * 手牌がTehai13（有効枚数13枚）であるか検証します。
 * @throws {ShoushaiError} 枚数が不足している場合
 * @throws {TahaiError} 枚数が超過している場合
 */
export function validateTehai13<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): void {
  const count = calculateTehaiCount(tehai);
  if (count < 13) {
    throw new ShoushaiError();
  }
  if (count > 13) {
    throw new TahaiError();
  }
}

/**
 * 手牌がTehai14（有効枚数14枚）であるか検証します。
 * @throws {ShoushaiError} 枚数が不足している場合
 * @throws {TahaiError} 枚数が超過している場合
 */
export function validateTehai14<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): void {
  const count = calculateTehaiCount(tehai);
  if (count < 14) {
    throw new ShoushaiError();
  }
  if (count > 14) {
    throw new TahaiError();
  }
}

/**
 * 手牌がTehai13またはTehai14（有効枚数が13または14枚）であるか検証します。
 * シャンテン計算や待ち判定など、13枚/14枚の区別なく手牌として扱いたい場合に使用します。
 *
 * @throws {ShoushaiError} 枚数が不足している場合 (< 13)
 * @throws {TahaiError} 枚数が超過している場合 (> 14)
 */
export function validateTehai<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): void {
  const count = calculateTehaiCount(tehai);
  if (count < 13) {
    throw new ShoushaiError();
  }
  if (count > 14) {
    throw new TahaiError();
  }
}

/**
 * Type Guard for Tehai13
 */
export function isTehai13<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): tehai is Tehai13<T> {
  try {
    validateTehai13(tehai);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type Guard for Tehai14
 */
export function isTehai14<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): tehai is Tehai14<T> {
  try {
    validateTehai14(tehai);
    return true;
  } catch {
    return false;
  }
}
