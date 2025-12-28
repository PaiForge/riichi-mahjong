import { asHaiKindId, isTuple3, isTuple4 } from "../../utils/assertions";
import { ShoushaiError, TahaiError } from "../../errors";
import {
  CompletedMentsu,
  FuroType,
  HaiId,
  HaiKind,
  HaiKindDistribution,
  HaiKindId,
  Kantsu,
  Koutsu,
  MentsuType,
  Shuntsu,
  Tacha,
} from "../../types";
import { haiIdToKindId, haiKindToNumber } from "../../core/hai";

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
 * 文字列を ExtendedMspzString 型として扱います。
 * 拡張MSPZ形式であることを検証します。
 *
 * @param input 変換対象の文字列
 * @throws {Error} 拡張MSPZ形式でない場合
 * @returns ExtendedMspzString
 */
export function asExtendedMspz(input: string): ExtendedMspzString {
  if (!isExtendedMspz(input)) {
    throw new Error(`Invalid Extended MSPZ string: ${input}`);
  }
  return input;
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
export interface ExtendedMspzParseResult {
  readonly closed: readonly HaiKindId[];
  readonly exposed: readonly CompletedMentsu[];
}

/**
 * 拡張MSPZ形式の文字列を解析して、純手牌と副露のリストに変換します。
 *
 * @param input 拡張MSPZ形式の文字列
 * @returns 解析結果オブジェクト
 */
export function parseExtendedMspz(input: string): ExtendedMspzParseResult {
  const closedParts: string[] = [];
  const exposed: CompletedMentsu[] = [];

  let current = "";
  let mode: "closed" | "open" | "ankan" = "closed";

  // 文字単位でパース
  for (const char of input) {
    if (char === "[") {
      if (mode !== "closed")
        throw new Error("Nested brackets are not supported");
      if (current.length > 0) closedParts.push(current);
      // current = ""; // OLD
      current = "["; // NEW: Start capturing with bracket
      mode = "open";
    } else if (char === "]") {
      if (mode !== "open") throw new Error("Unexpected closing bracket ']'");
      current += "]"; // NEW: End capturing with bracket
      // exposed.push(parseMentsuString(current, "open")); // OLD
      exposed.push(parseMentsuFromExtendedMspz(asExtendedMspz(current))); // NEW
      current = "";
      mode = "closed";
    } else if (char === "(") {
      if (mode !== "closed")
        throw new Error("Nested parentheses are not supported");
      if (current.length > 0) closedParts.push(current);
      // current = ""; // OLD
      current = "("; // NEW
      mode = "ankan";
    } else if (char === ")") {
      if (mode !== "ankan")
        throw new Error("Unexpected closing parenthesis ')'");
      current += ")"; // NEW
      // exposed.push(parseMentsuString(current, "ankan")); // OLD
      exposed.push(parseMentsuFromExtendedMspz(asExtendedMspz(current))); // NEW
      current = "";
      mode = "closed";
    } else {
      current += char;
    }
  }

  // 残りのclosed部分
  if (current.length > 0) {
    if (mode !== "closed") throw new Error("Unclosed bracket or parenthesis");
    closedParts.push(current);
  }

  // closed部分を結合してパース
  const fullClosedMspz = closedParts.join("");
  const closedIds = mspzStringToHaiKindIds(asMspz(fullClosedMspz));

  return {
    closed: closedIds,
    exposed: exposed,
  };
}

/**
 * 副露・暗槓のブロック文字列（例: "[123m]", "(11z)"）を解析してCompletedMentsuを生成する内部関数
 * 括弧の種類から副露か暗槓かを自動判定します。
 */
function parseMentsuFromExtendedMspz(
  block: ExtendedMspzString,
): CompletedMentsu {
  let mode: "open" | "ankan";
  let content: string;

  if (block.startsWith("[") && block.endsWith("]")) {
    mode = "open";
    content = block.slice(1, -1);
  } else if (block.startsWith("(") && block.endsWith(")")) {
    mode = "ankan";
    content = block.slice(1, -1);
  } else {
    throw new Error(
      `Invalid Extended MSPZ block: ${block} (must be [...] or (...))`,
    );
  }

  // 中身は標準MSPZ形式である必要がある
  const ids = mspzStringToHaiKindIds(asMspz(content));
  if (ids.length === 0) {
    throw new Error("Empty mentsu specification");
  }

  // 枚数チェック & 種類判定
  const count = ids.length;
  const isAllSame = ids.every((id) => id === ids[0]);

  // 暗槓 (Ankan)
  if (mode === "ankan") {
    if (count !== 4 || !isAllSame) {
      throw new Error(`Invalid Ankan: ${block} (must be 4 identical tiles)`);
    }
    if (!isTuple4(ids)) {
      throw new Error("Internal Error: ids length check mismatch");
    }
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: ids,
      // Ankan has no furo info (or minimal)
    };
    return kantsu;
  }

  // 副露 (Open)
  if (count === 4 && isAllSame) {
    // Daiminkan
    if (!isTuple4(ids)) {
      throw new Error("Internal Error: ids length check mismatch");
    }
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: ids,
      furo: { type: FuroType.Daiminkan, from: Tacha.Toimen }, // Default
    };
    return kantsu;
  } else if (count === 3 && isAllSame) {
    // Pon
    if (!isTuple3(ids)) {
      throw new Error("Internal Error: ids length check mismatch");
    }
    const koutsu: Koutsu = {
      type: MentsuType.Koutsu,
      hais: ids,
      furo: { type: FuroType.Pon, from: Tacha.Toimen }, // Default
    };
    return koutsu;
  } else if (count === 3) {
    // Chi (Should check continuity, strictly speaking but relying on user for now or implicit check)
    // Minimal check: sorted? mspzStringToHaiKindIds sorts by default?
    // mspzStringToHaiKindIds does NOT sort across different suits, but "123m" results in sorted array.
    // Let's assume valid sequence for now.
    if (!isTuple3(ids)) {
      throw new Error("Internal Error: ids length check mismatch");
    }
    const shuntsu: Shuntsu = {
      type: MentsuType.Shuntsu,
      hais: ids,
      furo: { type: FuroType.Chi, from: Tacha.Kamicha }, // Default
    };
    return shuntsu;
  }

  throw new Error(
    `Invalid Mentsu specification: ${block} (must be 3 or 4 tiles)`,
  );
}

/**
 * 13枚の牌種ID配列を 34種の牌種分布（所持数分布）に変換します。
 * @throws {ShoushaiError} 牌の数が13枚より少ない場合
 * @throws {TahaiError} 牌の数が13枚より多い場合
 */
export function haiKindIdsToDistribution(
  hais: readonly HaiKindId[],
): HaiKindDistribution {
  if (hais.length < 13) {
    throw new ShoushaiError(
      `Invalid number of tiles: expected 13, got ${hais.length}`,
    );
  }
  if (hais.length > 13) {
    throw new TahaiError(
      `Invalid number of tiles: expected 13, got ${hais.length}`,
    );
  }

  const counts = Array.from({ length: 34 }, () => 0);

  for (const kind of hais) {
    counts[kind] = (counts[kind] ?? 0) + 1;
  }

  // Tupleへの変換はアサーションが必要だが、生成ロジックが保証しているため安全
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return counts as unknown as HaiKindDistribution;
}

/**
 * 13枚の牌ID配列を 34種の牌種分布（所持数分布）に変換します。
 * @throws {ShoushaiError} 牌の数が13枚より少ない場合
 * @throws {TahaiError} 牌の数が13枚より多い場合
 */
export function haiIdsToDistribution(
  // Branded type makes linter think it's mutable object, but it's primitive number.
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  hais: readonly HaiId[],
): HaiKindDistribution {
  const kinds = hais.map(haiIdToKindId);
  return haiKindIdsToDistribution(kinds);
}

/**
 * 13枚の牌種ID配列を MSPZ形式の文字列（例: "123m456p..."）に変換します。
 * すべての牌をソートして表記します。
 * @throws {ShoushaiError} 牌の数が13枚より少ない場合
 * @throws {TahaiError} 牌の数が13枚より多い場合
 */
export function haiKindIdsToMspzString(hais: readonly HaiKindId[]): string {
  const counts = haiKindIdsToDistribution(hais);
  let result = "";

  // 萬子
  const manzu: number[] = [];
  for (let i = 0; i < 9; i++) {
    const kind = asHaiKindId(HaiKind.ManZu1 + i);
    const count = counts[kind];
    for (let j = 0; j < count; j++) {
      const num = haiKindToNumber(kind);
      if (num !== undefined) manzu.push(num);
    }
  }
  if (manzu.length > 0) {
    result += manzu.join("") + "m";
  }

  // 筒子
  const pinzu: number[] = [];
  for (let i = 0; i < 9; i++) {
    const kind = asHaiKindId(HaiKind.PinZu1 + i);
    const count = counts[kind];
    for (let j = 0; j < count; j++) {
      const num = haiKindToNumber(kind);
      if (num !== undefined) pinzu.push(num);
    }
  }
  if (pinzu.length > 0) {
    result += pinzu.join("") + "p";
  }

  // 索子
  const souzu: number[] = [];
  for (let i = 0; i < 9; i++) {
    const kind = asHaiKindId(HaiKind.SouZu1 + i);
    const count = counts[kind];
    for (let j = 0; j < count; j++) {
      const num = haiKindToNumber(kind);
      if (num !== undefined) souzu.push(num);
    }
  }
  if (souzu.length > 0) {
    result += souzu.join("") + "s";
  }

  // 字牌
  const jihai: number[] = [];
  for (let i = 0; i < 7; i++) {
    const kind = asHaiKindId(HaiKind.Ton + i);
    const count = counts[kind];
    for (let j = 0; j < count; j++) {
      // 字牌は 1-7 で表すことが多い
      const num = i + 1;
      jihai.push(num);
    }
  }
  if (jihai.length > 0) {
    result += jihai.join("") + "z";
  }

  return result;
}

/**
 * 文字列を MspzString 型として扱います。
 * 標準的なMSPZ形式（拡張記法を含まない）であることを検証します。
 *
 * @param input 変換対象の文字列
 * @throws {Error} 拡張記法が含まれている場合
 * @returns MspzString
 */
export function asMspz(input: string): MspzString {
  if (!isMspz(input)) {
    throw new Error(`Invalid MSPZ string: ${input}`);
  }
  return input;
}

/**
 * MSPZ形式の文字列（例: "123m456p"）を解析して HaiKindId の配列に変換します。
 * 主にテストデータの作成用途で使用します。
 *
 * @param mspz MSPZ形式の文字列
 * @returns HaiKindId の配列
 */
export function mspzStringToHaiKindIds(mspz: MspzString): HaiKindId[] {
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
