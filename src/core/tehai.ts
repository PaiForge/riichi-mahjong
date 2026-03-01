import {
  DuplicatedHaiIdError,
  InvalidHaiQuantityError,
  ShoushaiError,
  TahaiError,
} from "../errors";
import { Result, ok, err } from "neverthrow";
import type {
  HaiId,
  HaiKindDistribution,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
} from "../types";

export type TehaiError =
  | ShoushaiError
  | TahaiError
  | InvalidHaiQuantityError
  | DuplicatedHaiIdError;
import { haiIdToKindId } from "./hai";

/**
 * 手牌の有効枚数を計算します。
 * 副露（槓子含む）は一律3枚として計算します。
 */
function calculateTehaiCount<T extends HaiKindId | HaiId>(
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
 * 手牌がTehai13（有効枚数13枚）であるか検証し、スマートコンストラクタとして機能します。
 * バリデーション成功後、Tehai13 型にナローイングされたオブジェクトをResultで返します。
 */
export function validateTehai13<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<Tehai13<T>, TehaiError> {
  const count = calculateTehaiCount(tehai);
  if (count < 13) {
    return err(new ShoushaiError());
  }
  if (count > 13) {
    return err(new TahaiError());
  }
  const consRes = validateHaiConsistency(tehai);
  if (consRes.isErr()) {
    return err(consRes.error);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return ok(tehai as Tehai13<T>);
}

/**
 * 手牌がTehai14（有効枚数14枚）であるか検証し、スマートコンストラクタとして機能します。
 * バリデーション成功後、Tehai14 型にナローイングされたオブジェクトをResultで返します。
 */
export function validateTehai14<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<Tehai14<T>, TehaiError> {
  const count = calculateTehaiCount(tehai);
  if (count < 14) {
    return err(new ShoushaiError());
  }
  if (count > 14) {
    return err(new TahaiError());
  }
  const consRes = validateHaiConsistency(tehai);
  if (consRes.isErr()) {
    return err(consRes.error);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return ok(tehai as Tehai14<T>);
}

/**
 *
 */
export function validateTehai<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<Tehai<T>, TehaiError> {
  const count = calculateTehaiCount(tehai);
  if (count < 13) {
    return err(new ShoushaiError());
  }
  if (count > 14) {
    return err(new TahaiError());
  }
  const consRes = validateHaiConsistency(tehai);
  if (consRes.isErr()) {
    return err(consRes.error);
  }
  return ok(tehai);
}

/**
 *
 */
export function validateHaiConsistency<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<void, DuplicatedHaiIdError | InvalidHaiQuantityError> {
  const allHais: number[] = [
    ...tehai.closed,
    ...tehai.exposed.flatMap((m) => m.hais),
  ];

  // 1. Check for physical HaiId usage (any id > 33)
  const isHaiIdMode = allHais.some((h) => h > 33);

  if (isHaiIdMode) {
    // Check for duplicate HaiIds
    const uniqueIds = new Set(allHais);
    if (uniqueIds.size !== allHais.length) {
      return err(new DuplicatedHaiIdError());
    }
  }

  // 2. Check for Kind quantity (max 4 per kind)
  const counts = new Map<number, number>();
  for (const hai of allHais) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kind: number = isHaiIdMode ? haiIdToKindId(hai as HaiId) : hai;

    const current = counts.get(kind) ?? 0;
    if (current + 1 > 4) {
      return err(new InvalidHaiQuantityError());
    }
    counts.set(kind, current + 1);
  }
  return ok(undefined);
}

/**
 * Type Guard for Tehai13
 */
export function isTehai13<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): tehai is Tehai13<T> {
  return validateTehai13(tehai).isOk();
}

/**
 * Type Guard for Tehai14
 */
export function isTehai14<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): tehai is Tehai14<T> {
  return validateTehai14(tehai).isOk();
}
