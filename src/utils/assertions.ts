import { type HaiId, type HaiKindId } from "../types";

/**
 * Checks if the array has exactly 2 elements and narrows the type to a tuple.
 */
export function isTuple2<T>(arr: readonly T[]): arr is readonly [T, T] {
  return arr.length === 2;
}

/**
 * Checks if the array has exactly 3 elements and narrows the type to a tuple.
 */
export function isTuple3<T>(arr: readonly T[]): arr is readonly [T, T, T] {
  return arr.length === 3;
}

/**
 * Checks if the array has exactly 4 elements and narrows the type to a tuple.
 */
export function isTuple4<T>(arr: readonly T[]): arr is readonly [T, T, T, T] {
  return arr.length === 4;
}

/**
 * Casts a number to HaiKindId safely (conceptually).
 * Use this only when you are sure the number is a valid HaiKindId.
 */
export function asHaiKindId(id: number): HaiKindId {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return id as HaiKindId;
}

/**
 * Casts a number to HaiId safely (conceptually).
 */
export function asHaiId(id: number): HaiId {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return id as HaiId;
}
