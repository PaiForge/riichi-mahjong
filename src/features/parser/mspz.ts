import { Result, ok, err } from "neverthrow";
import { asHaiKindId, isTuple3, isTuple4 } from "../../utils/assertions";
import { MspzParseError } from "../../errors";
import {
  CompletedMentsu,
  FuroType,
  HaiKind,
  HaiKindId,
  Kantsu,
  Koutsu,
  MentsuType,
  Shuntsu,
  Tacha,
} from "../../types";

// 1つ以上の数字 + 1つのサフィックス (m, p, s, z)
const BLOCK_PATTERN = "\\d+[mpsz]";
// 標準的なMSPZ: ブロックの繰り返し (空文字列も許容)
const STANDARD_MSPZ_REGEX = new RegExp(`^(${BLOCK_PATTERN})*$`);

// 拡張パート: [...] または (...) で囲まれたブロック (囲みの中も同様のブロック構造)
// 注: 現在のパーサー実装では、[] の中は単純な BLOCK_PATTERN の連続を許容しているか?
// parseMentsuString: mspzStringToHaiKindIds を呼んでいる。
// mspzStringToHaiKindIds: \d+[mpsz] をパースする。
// したがって、[] の中身も BLOCK_PATTERN の繰り返しであるべき。
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
 *
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
 * 拡張MSPZ解析結果
 */
interface ExtendedMspzParseResult {
  readonly closed: readonly HaiKindId[];
  readonly exposed: readonly CompletedMentsu[];
}

/**
 * 拡張MSPZ形式の文字列を解析して、純手牌と副露のリストに変換します。
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

/**
 * 副露・暗槓のブロック文字列（例: "[123m]", "(11z)"）を解析してCompletedMentsuを生成する内部関数
 * 括弧の種類から副露か暗槓かを自動判定します。
 */
function parseMentsuFromExtendedMspz(
  block: ExtendedMspzString,
): Result<CompletedMentsu, MspzParseError> {
  let mode: "open" | "ankan";
  let content: string;

  if (block.startsWith("[") && block.endsWith("]")) {
    mode = "open";
    content = block.slice(1, -1);
  } else if (block.startsWith("(") && block.endsWith(")")) {
    mode = "ankan";
    content = block.slice(1, -1);
  } else {
    return err(
      new MspzParseError(
        `Invalid Extended MSPZ block: ${block} (must be [...] or (...))`,
      ),
    );
  }

  // 中身は標準MSPZ形式である必要がある
  const mspzRes = asMspz(content);
  if (mspzRes.isErr()) return err(mspzRes.error);

  const ids = parseMspzToHaiKindIds(mspzRes.value);
  if (ids.length === 0) {
    return err(new MspzParseError("Empty mentsu specification"));
  }

  // 枚数チェック & 種類判定
  const count = ids.length;
  const isAllSame = ids.every((id) => id === ids[0]);

  // 暗槓 (Ankan)
  if (mode === "ankan") {
    if (count !== 4 || !isAllSame) {
      return err(
        new MspzParseError(
          `Invalid Ankan: ${block} (must be 4 identical tiles)`,
        ),
      );
    }
    if (!isTuple4(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: ids,
      // Ankan has no furo info (or minimal)
    };
    return ok(kantsu);
  }

  // 副露 (Open)
  if (count === 4 && isAllSame) {
    // Daiminkan
    if (!isTuple4(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: ids,
      furo: { type: FuroType.Daiminkan, from: Tacha.Toimen }, // Default
    };
    return ok(kantsu);
  } else if (count === 3 && isAllSame) {
    // Pon
    if (!isTuple3(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const koutsu: Koutsu = {
      type: MentsuType.Koutsu,
      hais: ids,
      furo: { type: FuroType.Pon, from: Tacha.Toimen }, // Default
    };
    return ok(koutsu);
  } else if (count === 3) {
    // Chi (Should check continuity, strictly speaking but relying on user for now or implicit check)
    // Minimal check: sorted? mspzStringToHaiKindIds sorts by default?
    // mspzStringToHaiKindIds does NOT sort across different suits, but "123m" results in sorted array.
    // Let's assume valid sequence for now.
    if (!isTuple3(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const shuntsu: Shuntsu = {
      type: MentsuType.Shuntsu,
      hais: ids,
      furo: { type: FuroType.Chi, from: Tacha.Kamicha }, // Default
    };
    return ok(shuntsu);
  }

  return err(
    new MspzParseError(
      `Invalid Mentsu specification: ${block} (must be 3 or 4 tiles)`,
    ),
  );
}

/**
 *
 */
export function asMspz(input: string): Result<MspzString, MspzParseError> {
  if (!isMspz(input)) {
    return err(new MspzParseError(`Invalid MSPZ string: ${input}`));
  }
  return ok(input);
}

/**
 * MSPZ形式の文字列（例: "123m456p"）を解析して HaiKindId の配列に変換します。
 * 主にテストデータの作成用途で使用します。
 *
 * @param mspz MSPZ形式の文字列
 * @returns HaiKindId の配列
 */
export function parseMspzToHaiKindIds(mspz: MspzString): HaiKindId[] {
  const result: HaiKindId[] = [];
  let currentNumbers: number[] = [];

  for (const char of mspz) {
    if (char >= "0" && char <= "9") {
      currentNumbers.push(parseInt(char, 10));
    } else {
      // Suffix handling
      let base: HaiKindId | undefined;

      switch (char) {
        case "m":
          base = HaiKind.ManZu1;
          break;
        case "p":
          base = HaiKind.PinZu1;
          break;
        case "s":
          base = HaiKind.SouZu1;
          break;
        case "z":
          base = HaiKind.Ton;
          break;
        default:
          // 無視する
          currentNumbers = [];
          continue;
      }

      for (const num of currentNumbers) {
        if (char === "z") {
          // 字牌: 1=東(27), ... 7=中(33)
          if (num >= 1 && num <= 7) {
            result.push(asHaiKindId(base + num - 1));
          }
        } else {
          // 数牌: 1-9
          if (num >= 1) {
            result.push(asHaiKindId(base + num - 1));
          }
        }
      }
      currentNumbers = [];
    }
  }

  return result;
}
