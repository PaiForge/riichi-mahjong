import type { HaiKindId } from "../types.js";
import { haiKindToNumber, isSuupai, kindIdToHaiType } from "./hai.js";

// バリデーションロジックは「HaiKindId の配列」に対して行うものと定義する。
// HaiId を持つ Mentsu を検証したい場合は、呼び出し側で KindId に変換してから渡す必要がある。
// ただし、利便性のために `convertHaiIdToKindId` ヘルパーを export する。

/**
 * 順子かどうかを検証する
 * @param kindIds HaiKindIdの配列 (長さ3)
 */
export function isValidShuntsu(kindIds: readonly HaiKindId[]): boolean {
  if (kindIds.length !== 3) return false;

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
  return sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2];
}

/**
 * 刻子かどうかを検証する
 * @param kindIds HaiKindIdの配列 (長さ3)
 */
export function isValidKoutsu(kindIds: readonly HaiKindId[]): boolean {
  if (kindIds.length !== 3) return false;
  const [a, b, c] = kindIds;
  return a === b && b === c;
}

/**
 * 槓子かどうかを検証する
 * @param kindIds HaiKindIdの配列 (長さ4)
 */
export function isValidKantsu(kindIds: readonly HaiKindId[]): boolean {
  if (kindIds.length !== 4) return false;
  const [a, b, c, d] = kindIds;
  return a === b && b === c && c === d;
}

/**
 * 対子かどうかを検証する
 * @param kindIds HaiKindIdの配列 (長さ2)
 */
export function isValidToitsu(kindIds: readonly HaiKindId[]): boolean {
  if (kindIds.length !== 2) return false;
  const [a, b] = kindIds;
  return a === b;
}

/**
 * 塔子かどうかを検証する
 * 未実装
 */
export function isValidTatsu(_kindIds: readonly HaiKindId[]): boolean {
  throw new Error("Not implemented");
}
