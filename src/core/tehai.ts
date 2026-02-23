import {
  DuplicatedHaiIdError,
  InvalidHaiQuantityError,
  ShoushaiError,
  TahaiError,
} from "../errors";
import type {
  HaiId,
  HaiKindDistribution,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
} from "../types";
import { haiIdToKindId } from "./hai";

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
  validateHaiConsistency(tehai);
}

/**
 * 手牌がTehai14（有効枚数14枚）であるか検証します。
 * @throws {ShoushaiError} 枚数が不足している場合
 * @throws {TahaiError} 枚数が超過している場合
 * @throws {InvalidHaiQuantityError} 同一種の牌が5枚以上ある場合
 * @throws {DuplicatedHaiIdError} 物理牌モードでIDが重複している場合
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
  validateHaiConsistency(tehai);
}

/**
 * 手牌がTehai13またはTehai14（有効枚数が13または14枚）であるか検証します。
 * シャンテン計算や待ち判定など、13枚/14枚の区別なく手牌として扱いたい場合に使用します。
 *
 * @throws {ShoushaiError} 枚数が不足している場合 (< 13)
 * @throws {TahaiError} 枚数が超過している場合 (> 14)
 * @throws {InvalidHaiQuantityError} 同一種の牌が5枚以上ある場合
 * @throws {DuplicatedHaiIdError} 物理牌モードでIDが重複している場合
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
  validateHaiConsistency(tehai);
}

/**
 * 手牌の整合性を検証します。
 * - 物理的な牌ID (`HaiId`) が使われている場合、重複チェックを行います。
 * - 牌種ID (`HaiKindId`) の場合（または変換後）、同一牌種が5枚以上ないかチェックします。
 *
 * @throws {DuplicatedHaiIdError}
 * @throws {InvalidHaiQuantityError}
 */
function validateHaiConsistency<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): void {
  const allHais: number[] = [
    ...tehai.closed,
    ...tehai.exposed.flatMap((m) => m.hais),
  ];

  // 1. Check for physical HaiId usage (any id > 33)
  // HaiKindId is 0-33. Any value > 33 implies HaiId (0-135).
  // Note: Low HaiIds (0-33) are ambiguous, but if mix of high and low exists, it's HaiId.
  // If only low values exist, we can't strictly distinguish, but treating as KindId is safe
  // unless the user provided [0, 0] intending HaiId 0 and HaiId 0.
  // However, normally HaiKindId 0 is ManZu1.
  // Strategy: If MAX(id) > 33, treat as HaiId.
  const isHaiIdMode = allHais.some((h) => h > 33);

  if (isHaiIdMode) {
    // Check for duplicate HaiIds
    const uniqueIds = new Set(allHais);
    if (uniqueIds.size !== allHais.length) {
      throw new DuplicatedHaiIdError();
    }
  }

  // 2. Check for Kind quantity (max 4 per kind)
  const counts = new Map<number, number>();
  for (const hai of allHais) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kind: number = isHaiIdMode ? haiIdToKindId(hai as HaiId) : hai;

    const current = counts.get(kind) ?? 0;
    if (current + 1 > 4) {
      throw new InvalidHaiQuantityError();
    }
    counts.set(kind, current + 1);
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
