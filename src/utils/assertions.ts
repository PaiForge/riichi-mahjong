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
 * Checks if the array has exactly 7 elements and narrows the type to a tuple.
 */
export function isTuple7<T>(
  arr: readonly T[],
): arr is readonly [T, T, T, T, T, T, T] {
  return arr.length === 7;
}
