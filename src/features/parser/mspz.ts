import { Result, ok, err } from "neverthrow";
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
  let mode: "closed" | "open" | "ankan" = "closed";

  // 文字単位でパース
  for (const char of input) {
    if (char === "[") {
      if (mode !== "closed")
        return err(new MspzParseError("Nested brackets are not supported"));
      if (current.length > 0) closedParts.push(current);
      current = "["; // NEW: Start capturing with bracket
      mode = "open";
    } else if (char === "]") {
      if (mode !== "open")
        return err(new MspzParseError("Unexpected closing bracket ']'"));
      current += "]"; // NEW: End capturing with bracket
      const extMspzRes = asExtendedMspz(current);
      if (extMspzRes.isErr()) return err(extMspzRes.error);
      const mentsuRes = parseMentsuFromExtendedMspz(extMspzRes.value);
      if (mentsuRes.isErr()) return err(mentsuRes.error);
      exposed.push(mentsuRes.value);
      current = "";
      mode = "closed";
    } else if (char === "(") {
      if (mode !== "closed")
        return err(new MspzParseError("Nested parentheses are not supported"));
      if (current.length > 0) closedParts.push(current);
      current = "("; // NEW
      mode = "ankan";
    } else if (char === ")") {
      if (mode !== "ankan")
        return err(new MspzParseError("Unexpected closing parenthesis ')'"));
      current += ")"; // NEW
      const extMspzRes = asExtendedMspz(current);
      if (extMspzRes.isErr()) return err(extMspzRes.error);
      const mentsuRes = parseMentsuFromExtendedMspz(extMspzRes.value);
      if (mentsuRes.isErr()) return err(mentsuRes.error);
      exposed.push(mentsuRes.value);
      current = "";
      mode = "closed";
    } else {
      current += char;
    }
  }

  // 残りのclosed部分
  if (current.length > 0) {
    if (mode !== "closed")
      return err(new MspzParseError("Unclosed bracket or parenthesis"));
    closedParts.push(current);
  }

  // closed部分を結合してパース
  const fullClosedMspz = closedParts.join("");
  const mspzRes = asMspz(fullClosedMspz);
  if (mspzRes.isErr()) return err(mspzRes.error);

  const closedIds = parseMspzToHaiKindIds(mspzRes.value);

  return ok({
    closed: closedIds,
    exposed: exposed,
  });
}
