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

/** 囲み開始文字 → 対応する閉じ文字（`[...]`: 副露, `(...)`: 暗槓） */
const CLOSING_CHAR_OF = new Map<string, string>([
  ["[", "]"],
  ["(", ")"],
]);

const OPENING_CHARS: ReadonlySet<string> = new Set(CLOSING_CHAR_OF.keys());
const CLOSING_CHARS: ReadonlySet<string> = new Set(CLOSING_CHAR_OF.values());

/**
 * 走査結果。囲みブロックの中身と、それ以外の純手牌部分に分けたもの。
 */
interface EnclosureScanResult {
  /** 囲みの外にあった文字を結合したもの（純手牌のMSPZ表記） */
  readonly closedText: string;
  /** 囲み文字を含む各ブロック（例: `"[123m]"`, `"(1111z)"`） */
  readonly enclosures: readonly string[];
}

/**
 * 拡張MSPZ文字列を、囲みブロックとそれ以外に文字単位で切り分けます。
 *
 * ここで扱うのは囲みの構造だけで、ブロックの中身が面子として妥当かは判定しません
 * （それは parseMentsuFromExtendedMspz の責務）。
 *
 * @param input 拡張MSPZ形式の文字列
 * @returns 切り分け結果。囲みの構造が壊れていれば Err
 */
function splitEnclosures(
  input: string,
): Result<EnclosureScanResult, MspzParseError> {
  const closedParts: string[] = [];
  const enclosures: string[] = [];

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
      enclosures.push(current + char);
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

  return ok({ closedText: closedParts.join(""), enclosures });
}

/**
 * 囲みブロックのリストを面子のリストに変換します。
 * 1つでも面子として解釈できないブロックがあれば、最初のエラーを返します。
 */
function parseEnclosuresAsMentsu(
  enclosures: readonly string[],
): Result<CompletedMentsu[], MspzParseError> {
  return Result.combine(
    enclosures.map((block) =>
      asExtendedMspz(block).andThen(parseMentsuFromExtendedMspz),
    ),
  );
}

/**
 * 拡張MSPZ形式の文字列を解析して、純手牌と副露のリストに変換します。
 *
 * `[...]`（副露）・`(...)`（暗槓）の切り分けを splitEnclosures に、
 * 各ブロックの面子としての解釈を parseMentsuFromExtendedMspz に委譲し、
 * ここでは両者の結果を繋いで解析結果を組み立てます。
 *
 * @param input 拡張MSPZ形式の文字列
 * @returns 解析結果オブジェクト
 */
export function parseExtendedMspz(
  input: string,
): Result<ExtendedMspzParseResult, MspzParseError> {
  return splitEnclosures(input).andThen(({ closedText, enclosures }) =>
    parseEnclosuresAsMentsu(enclosures).andThen((exposed) =>
      asMspz(closedText).map((mspz) => ({
        closed: parseMspzToHaiKindIds(mspz),
        exposed,
      })),
    ),
  );
}
