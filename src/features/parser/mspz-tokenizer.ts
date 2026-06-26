import { asHaiKindId } from "../../utils/assertions";
import { HaiKind, type HaiKindId } from "../../types";
import type { MspzString } from "./mspz-string";

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
