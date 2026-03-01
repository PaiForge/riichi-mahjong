import {
  parseExtendedMspz as internalParseExtendedMspz,
  parseMspzToHaiKindIds,
  asMspz,
  asExtendedMspz,
} from "./mspz";
import type { Tehai } from "../../types";
import { Result, ok, err } from "neverthrow";
import { MspzParseError } from "../../errors";

export type { MspzString, ExtendedMspzString } from "./mspz";
export { isExtendedMspz } from "./mspz";

/**
 * 標準的なMSPZ文字列（例: "123m456p..."）を解析して手牌オブジェクトを生成します。
 * 副露牌は含まれません。
 *
 * @param input MSPZ形式の文字列
 * @returns 手牌オブジェクト
 */
export function parseMspz(input: string): Result<Tehai, MspzParseError> {
  const mspzRes = asMspz(input);
  if (mspzRes.isErr()) return err(mspzRes.error);

  const ids = parseMspzToHaiKindIds(mspzRes.value);
  return ok({
    closed: ids,
    exposed: [],
  });
}

/**
 * 拡張MSPZ文字列（例: "123m[123p]..."）を解析して手牌オブジェクトを生成します。
 * 副露牌（`[...]`）や暗槓（`(...)`）を含めることができます。
 *
 * @param input 拡張MSPZ形式の文字列
 * @returns 手牌オブジェクト
 */
export function parseExtendedMspz(
  input: string,
): Result<Tehai, MspzParseError> {
  const extMspzRes = asExtendedMspz(input);
  if (extMspzRes.isErr()) return err(extMspzRes.error);

  const parsedRes = internalParseExtendedMspz(extMspzRes.value);
  if (parsedRes.isErr()) return err(parsedRes.error);

  return ok(parsedRes.value);
}
