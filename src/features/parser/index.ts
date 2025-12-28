import {
  parseExtendedMspz,
  mspzStringToHaiKindIds,
  asMspz,
  asExtendedMspz,
} from "./mspz";
import type { Tehai } from "../../types";

export type { MspzString, ExtendedMspzString } from "./mspz";
export { isExtendedMspz } from "./mspz";

/**
 * 標準的なMSPZ文字列（例: "123m456p..."）を解析して手牌オブジェクトを生成します。
 * 副露牌は含まれません。
 *
 * @param input MSPZ形式の文字列
 * @returns 手牌オブジェクト
 */
export function parseMspzToTehai(input: string): Tehai {
  const ids = mspzStringToHaiKindIds(asMspz(input));
  return {
    closed: ids,
    exposed: [],
  };
}

/**
 * 拡張MSPZ文字列（例: "123m[123p]..."）を解析して手牌オブジェクトを生成します。
 * 副露牌（`[...]`）や暗槓（`(...)`）を含めることができます。
 *
 * @param input 拡張MSPZ形式の文字列
 * @returns 手牌オブジェクト
 */
export function parseExtendedMspzToTehai(input: string): Tehai {
  // parseExtendedMspz returns { closed: HaiKindId[], exposed: CompletedMentsu[] }
  // which is compatible with Tehai interface.
  return parseExtendedMspz(asExtendedMspz(input));
}

// Re-export utility for raw IDs if needed internally, but prefer the above for public API.
// export { mspzStringToHaiKindIds };
