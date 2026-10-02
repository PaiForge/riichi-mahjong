import { HAI_KIND_IDS, HaiKind, type HaiKindId } from "../../types";
import type { MspzString } from "./mspz-string";

/** MSPZ のブロック（1つ以上の数字 + サフィックス）。例: "123m" */
const BLOCK_REGEX = /(\d+)([mpsz])/g;

/**
 * サフィックスに対応する牌種IDの起点（その色の 1 の牌）を返す。
 */
function suitBaseOf(suffix: string): HaiKindId | undefined {
  switch (suffix) {
    case "m":
      return HaiKind.ManZu1;
    case "p":
      return HaiKind.PinZu1;
    case "s":
      return HaiKind.SouZu1;
    case "z":
      return HaiKind.Ton;
    default:
      return undefined;
  }
}

/**
 * ブロック内の数字がその色で有効な牌番号かを判定する。
 * 字牌は 1=東(27), ... 7=中(33) の 7 種、数牌は 1-9。
 * 範囲外の数字（0 など）は牌として扱わず読み飛ばす。
 */
function isValidHaiNumber(suffix: string, num: number): boolean {
  return suffix === "z" ? num >= 1 && num <= 7 : num >= 1;
}

/**
 * 1ブロック（例: "123m"）を牌種IDの列に変換する。
 */
function parseBlock(digits: string, suffix: string): HaiKindId[] {
  const base = suitBaseOf(suffix);
  if (base === undefined) return [];

  // digits は正規表現で \d+ に限定されているため 1 文字 = 1 桁。
  // 有効な牌番号なら base + num - 1 は 0〜33 に収まるため HAI_KIND_IDS の添字で引ける。
  return Array.from(digits, (char) => parseInt(char, 10))
    .filter((num) => isValidHaiNumber(suffix, num))
    .flatMap((num) => {
      const kind = HAI_KIND_IDS[base + num - 1];
      return kind === undefined ? [] : [kind];
    });
}

/**
 * MSPZ形式の文字列（例: "123m456p"）を解析して HaiKindId の配列に変換します。
 * 主にテストデータの作成用途で使用します。
 *
 * 入力は検証済みの MspzString（ブロックの繰り返し）であるため、
 * ブロック単位で切り出して牌種IDへ変換します。
 *
 * @param mspz MSPZ形式の文字列
 * @returns HaiKindId の配列
 */
export function parseMspzToHaiKindIds(mspz: MspzString): HaiKindId[] {
  return [...mspz.matchAll(BLOCK_REGEX)].flatMap(([, digits, suffix]) =>
    parseBlock(digits ?? "", suffix ?? ""),
  );
}
