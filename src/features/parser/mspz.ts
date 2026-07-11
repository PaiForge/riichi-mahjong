import { Result, err } from "neverthrow";
import { MspzParseError } from "../../errors";
import type { CompletedMentsu, HaiKindId } from "../../types";
import { asExtendedMspz, asMspz } from "./mspz-string";
import { parseMspzToHaiKindIds } from "./mspz-tokenizer";
import { parseMentsuFromExtendedMspz } from "./mspz-mentsu";

// MSPZ 関連の公開面を集約して再エクスポートする（後方互換のためのファサード）。
export * from "./mspz-string";
export * from "./mspz-tokenizer";

/**
 * 拡張MSPZ解析結果
 */
interface ExtendedMspzParseResult {
  readonly closed: readonly HaiKindId[];
  readonly exposed: readonly CompletedMentsu[];
}

/** 囲み開始文字 → 対応する閉じ文字（`[...]`: 副露, `(...)`: 暗槓） */
const CLOSING_CHAR_OF = new Map<string, string>([
  ["[", "]"],
  ["(", ")"],
]);

const OPENING_CHARS: ReadonlySet<string> = new Set(CLOSING_CHAR_OF.keys());
const CLOSING_CHARS: ReadonlySet<string> = new Set(CLOSING_CHAR_OF.values());

/**
 * 拡張MSPZ形式の文字列を解析して、純手牌と副露のリストに変換します。
 *
 * `[...]`（副露）・`(...)`（暗槓）を文字単位でスキャンし、囲みブロックは
 * 面子へ、それ以外は closed 部分として集約します。面子の種別判定は
 * parseMentsuFromExtendedMspz に委譲します。
 *
 * @param input 拡張MSPZ形式の文字列
 * @returns 解析結果オブジェクト
 */
export function parseExtendedMspz(
  input: string,
): Result<ExtendedMspzParseResult, MspzParseError> {
  const closedParts: string[] = [];
  const exposed: CompletedMentsu[] = [];

  let current = "";
  // 囲みブロックの解析中は、期待する閉じ文字を保持する
  let expectedClosing: string | undefined;

  for (const char of input) {
    if (OPENING_CHARS.has(char)) {
      if (expectedClosing !== undefined) {
        return err(new MspzParseError("Nested enclosures are not supported"));
      }
      if (current.length > 0) closedParts.push(current);
      current = char;
      expectedClosing = CLOSING_CHAR_OF.get(char);
    } else if (CLOSING_CHARS.has(char)) {
      if (expectedClosing !== char) {
        return err(
          new MspzParseError(`Unexpected closing character '${char}'`),
        );
      }
      const mentsuRes = asExtendedMspz(current + char).andThen(
        parseMentsuFromExtendedMspz,
      );
      if (mentsuRes.isErr()) return err(mentsuRes.error);
      exposed.push(mentsuRes.value);
      current = "";
      expectedClosing = undefined;
    } else {
      current += char;
    }
  }

  if (expectedClosing !== undefined) {
    return err(new MspzParseError("Unclosed bracket or parenthesis"));
  }
  if (current.length > 0) closedParts.push(current);

  // closed部分を結合してパース
  return asMspz(closedParts.join("")).map((mspz) => ({
    closed: parseMspzToHaiKindIds(mspz),
    exposed,
  }));
}
