import { asHaiKindId } from "../utils/assertions";
import { ShoushaiError, TahaiError } from "../errors";
import { HaiId, HaiKind, HaiKindDistribution, HaiKindId } from "../types";
import { haiIdToKindId, haiKindToNumber } from "../core/hai";

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
 * MSPZ形式の文字列（例: "123m456p"）を解析して HaiKindId の配列に変換します。
 * 主にテストデータの作成用途で使用します。
 *
 * @param mspz MSPZ形式の文字列
 * @returns HaiKindId の配列
 */
export function mspzStringToHaiKindIds(mspz: string): HaiKindId[] {
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
