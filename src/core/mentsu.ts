import type { HaiKindId } from "../types";
import { haiKindToNumber, isSuupai, kindIdToHaiType } from "./hai";
import { isTuple2, isTuple3, isTuple4 } from "../utils/assertions";

// バリデーションロジックは「HaiKindId の配列」に対して行うものと定義する。
// HaiId を持つ Mentsu を検証したい場合は、呼び出し側で KindId に変換してから渡す必要がある。
// ただし、利便性のために `convertHaiIdToKindId` ヘルパーを export する。

/**
 * 順子かどうかを検証する

 */
export function isValidShuntsu(kindIds: readonly HaiKindId[]): boolean {
  if (!isTuple3(kindIds)) return false;

  const [a, b, c] = kindIds;
  if (!isSuupai(a) || !isSuupai(b) || !isSuupai(c)) return false;

  const typeA = kindIdToHaiType(a);
  const typeB = kindIdToHaiType(b);
  const typeC = kindIdToHaiType(c);

  if (typeA !== typeB || typeA !== typeC) return false;

  const numA = haiKindToNumber(a);
  const numB = haiKindToNumber(b);
  const numC = haiKindToNumber(c);

  if (numA === undefined || numB === undefined || numC === undefined)
    return false;

  // ソートして連続性をチェック
  const sorted = [numA, numB, numC].sort((x, y) => x - y);

  // Safe to access since we just created it with 3 elements
  // But strict check might complain about index access on array
  if (!isTuple3(sorted)) return false; // Should be always true
  return sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2];
}

/**
 * 刻子かどうかを検証する

 */
export function isValidKoutsu(kindIds: readonly HaiKindId[]): boolean {
  if (!isTuple3(kindIds)) return false;
  const [a, b, c] = kindIds;
  return a === b && b === c;
}

/**
 * 槓子かどうかを検証する

 */
export function isValidKantsu(kindIds: readonly HaiKindId[]): boolean {
  if (!isTuple4(kindIds)) return false;
  const [a, b, c, d] = kindIds;
  return a === b && b === c && c === d;
}

/**
 * 対子かどうかを検証する

 */
export function isValidToitsu(kindIds: readonly HaiKindId[]): boolean {
  if (!isTuple2(kindIds)) return false;
  const [a, b] = kindIds;
  return a === b;
}

/**
 * 塔子かどうかを検証する

 */
export function isValidTatsu(kindIds: readonly HaiKindId[]): boolean {
  if (!isTuple2(kindIds)) return false;
  const [a, b] = kindIds;

  // 数牌でなければならない
  if (!isSuupai(a) || !isSuupai(b)) return false;

  // 同じ種類でなければならない
  const typeA = kindIdToHaiType(a);
  const typeB = kindIdToHaiType(b);
  if (typeA !== typeB) return false;

  const numA = haiKindToNumber(a);
  const numB = haiKindToNumber(b);

  if (numA === undefined || numB === undefined) return false;

  const diff = Math.abs(numA - numB);
  // 差が1 (ペンチャン/リャンメン) または 2 (カンチャン) ならOK
  return diff === 1 || diff === 2;
}
