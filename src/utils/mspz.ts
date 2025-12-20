/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import { HaiId, HaiKind, HaiKindId } from "../types";
import { haiKindToNumber, normalizeHaiIds } from "../core/hai";

/**
 * 13枚の牌ID配列を 34種の牌カウント配列（整数配列）に変換します。
 * @throws {Error} 牌の数が13枚でない場合
 */
export function haiIdsToCounts34(
  hais: readonly (HaiKindId | HaiId)[],
): number[] {
  if (hais.length !== 13) {
    throw new Error(`Invalid number of tiles: expected 13, got ${hais.length}`);
  }

  const counts = Array.from({ length: 34 }, () => 0);
  const kinds = normalizeHaiIds(hais);

  for (const kind of kinds) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts[kind]!++;
  }

  return counts;
}

/**
 * 13枚の牌ID配列を MSPZ形式の文字列（例: "123m456p..."）に変換します。
 * すべての牌をソートして表記します。
 * @throws {Error} 牌の数が13枚でない場合
 */
export function haiIdsToMspzString(
  hais: readonly (HaiKindId | HaiId)[],
): string {
  const counts = haiIdsToCounts34(hais);
  let result = "";

  // 萬子
  const manzu = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.ManZu1; i <= HaiKind.ManZu9; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      manzu.push(haiKindToNumber(i as HaiKindId));
    }
  }
  if (manzu.length > 0) {
    result += manzu.join("") + "m";
  }

  // 筒子
  const pinzu = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.PinZu1; i <= HaiKind.PinZu9; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      pinzu.push(haiKindToNumber(i as HaiKindId));
    }
  }
  if (pinzu.length > 0) {
    result += pinzu.join("") + "p";
  }

  // 索子
  const souzu = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.SouZu1; i <= HaiKind.SouZu9; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      souzu.push(haiKindToNumber(i as HaiKindId));
    }
  }
  if (souzu.length > 0) {
    result += souzu.join("") + "s";
  }

  // 字牌
  const jihai = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.Ton; i <= HaiKind.Chun; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // 字牌は 1-7 で表すことが多い (Testing tool such as tenhou-log uses this)
      // 東=1, 南=2, 西=3, 北=4, 白=5, 發=6, 中=7
      const num = i - HaiKind.Ton + 1;
      jihai.push(num);
    }
  }
  if (jihai.length > 0) {
    result += jihai.join("") + "z";
  }

  return result;
}

/**
 * MSPZ形式の文字列（例: "123m456p"）を解析して HaiKindId の配列に変換します。
 * 主にテストデータの作成用途で使用します。
 *
 * @param mspz MSPZ形式の文字列
 * @returns HaiKindId の配列
 */
export function mspzStringToHaiIds(mspz: string): HaiKindId[] {
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
          // 無視するかエラーにするか。ここではテスト用なので無視する実装とするが、
          // 不正な文字は処理されない。
          currentNumbers = []; // Clear buffer to be safe
          continue;
      }

      for (const num of currentNumbers) {
        if (char === "z") {
          // 字牌: 1=東(27), 2=南(28), ... 7=中(33)
          if (num >= 1 && num <= 7) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            result.push((base + num - 1) as HaiKindId);
          }
        } else {
          // 数牌: 1-9. 1=ManZu1(0), 9=ManZu9(8)
          // num=0 is often used for Red 5, but let's treat 0 as 5 (aka generic 5 handling) or ignore for now?
          // User context: simple shanten test. Usually 0 is Aka.
          // For now, let's treat 1-9 strict.
          if (num >= 1) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            result.push((base + num - 1) as HaiKindId);
          }
        }
      }
      currentNumbers = [];
    }
  }

  return result;
}
