import { Result, ok, err } from "neverthrow";
import { MspzParseError } from "../../errors";

// 1つ以上の数字 + 1つのサフィックス (m, p, s, z)
const BLOCK_PATTERN = "\\d+[mpsz]";
// 標準的なMSPZ: ブロックの繰り返し (空文字列も許容)
const STANDARD_MSPZ_REGEX = new RegExp(`^(${BLOCK_PATTERN})*$`);

// 拡張パート: [...] または (...) で囲まれたブロック (囲みの中も同様のブロック構造)
const EXTENDED_BLOCK_PATTERN = `(${BLOCK_PATTERN}|\\[(${BLOCK_PATTERN})+\\]|\\((${BLOCK_PATTERN})+\\))`;
const EXTENDED_MSPZ_REGEX = new RegExp(`^${EXTENDED_BLOCK_PATTERN}*$`);

/**
 * 標準的なMSPZ形式の文字列（拡張記法を含まない）
 */
export type MspzString = string & { readonly __brand: "MspzString" };

/**
 * 拡張MSPZ形式の文字列
 * 通常のMSPZに加え、`[...]` (副露) や `(...)` (暗槓) を含むことができます。
 */
export type ExtendedMspzString = string & {
  readonly __brand: "ExtendedMspzString";
};

/**
 * 文字列が拡張MSPZ形式（`[` または `(` を含み、かつ正しい書式）かどうかを判定します。
 * @param input 判定対象の文字列
 * @returns 拡張MSPZ形式であれば true
 */
export function isExtendedMspz(input: string): input is ExtendedMspzString {
  // ブラケットを含む、かつ拡張書式にマッチする場合のみ true
  // (ブラケットを含まない適正なMSPZは、ここでの定義上 ExtendedMspzString とはみなさない = MspzString と区別する)
  return (
    (input.includes("[") || input.includes("(")) &&
    EXTENDED_MSPZ_REGEX.test(input)
  );
}

/**
 * 文字列を ExtendedMspzString に検証変換するスマートコンストラクタ。
 */
export function asExtendedMspz(
  input: string,
): Result<ExtendedMspzString, MspzParseError> {
  if (!isExtendedMspz(input)) {
    return err(new MspzParseError(`Invalid Extended MSPZ string: ${input}`));
  }
  return ok(input);
}

/**
 * 文字列が標準的なMSPZ形式（拡張記法を含まず、かつ正しい書式）かどうかを判定します。
 * @param input 判定対象の文字列
 * @returns 標準MSPZ形式であれば true
 */
export function isMspz(input: string): input is MspzString {
  return STANDARD_MSPZ_REGEX.test(input);
}

/**
 * 文字列を MspzString に検証変換するスマートコンストラクタ。
 */
export function asMspz(input: string): Result<MspzString, MspzParseError> {
  if (!isMspz(input)) {
    return err(new MspzParseError(`Invalid MSPZ string: ${input}`));
  }
  return ok(input);
}
