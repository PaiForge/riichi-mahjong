import { describe, expect, it } from "vitest";
import { type HaiId, HaiKind, HaiType } from "../types";
import {
  haiIdToKindId,
  haiKindToNumber,
  isSuupai,
  kindIdToHaiType,
} from "./hai";

describe("kindIdToHaiType", () => {
  it("萬子のIDを正しく判定できる", () => {
    expect(kindIdToHaiType(HaiKind.ManZu1)).toBe(HaiType.Manzu);
    expect(kindIdToHaiType(HaiKind.ManZu5)).toBe(HaiType.Manzu);
    expect(kindIdToHaiType(HaiKind.ManZu9)).toBe(HaiType.Manzu);
  });

  it("筒子のIDを正しく判定できる", () => {
    expect(kindIdToHaiType(HaiKind.PinZu1)).toBe(HaiType.Pinzu);
    expect(kindIdToHaiType(HaiKind.PinZu5)).toBe(HaiType.Pinzu);
    expect(kindIdToHaiType(HaiKind.PinZu9)).toBe(HaiType.Pinzu);
  });

  it("索子のIDを正しく判定できる", () => {
    expect(kindIdToHaiType(HaiKind.SouZu1)).toBe(HaiType.Souzu);
    expect(kindIdToHaiType(HaiKind.SouZu5)).toBe(HaiType.Souzu);
    expect(kindIdToHaiType(HaiKind.SouZu9)).toBe(HaiType.Souzu);
  });

  it("字牌のIDを正しく判定できる", () => {
    expect(kindIdToHaiType(HaiKind.Ton)).toBe(HaiType.Jihai);
    expect(kindIdToHaiType(HaiKind.Nan)).toBe(HaiType.Jihai);
    expect(kindIdToHaiType(HaiKind.Sha)).toBe(HaiType.Jihai);
    expect(kindIdToHaiType(HaiKind.Pei)).toBe(HaiType.Jihai);
    expect(kindIdToHaiType(HaiKind.Haku)).toBe(HaiType.Jihai);
    expect(kindIdToHaiType(HaiKind.Hatsu)).toBe(HaiType.Jihai);
    expect(kindIdToHaiType(HaiKind.Chun)).toBe(HaiType.Jihai);
  });
});

describe("haiIdToKindId", () => {
  it("萬子の範囲 (0-35) を正しく変換できる", () => {
    expect(haiIdToKindId(0 as HaiId)).toBe(HaiKind.ManZu1);
    expect(haiIdToKindId(3 as HaiId)).toBe(HaiKind.ManZu1);
    expect(haiIdToKindId(4 as HaiId)).toBe(HaiKind.ManZu2);
    expect(haiIdToKindId(35 as HaiId)).toBe(HaiKind.ManZu9);
  });

  it("筒子の範囲 (36-71) を正しく変換できる", () => {
    expect(haiIdToKindId(36 as HaiId)).toBe(HaiKind.PinZu1);
    expect(haiIdToKindId(39 as HaiId)).toBe(HaiKind.PinZu1);
    expect(haiIdToKindId(40 as HaiId)).toBe(HaiKind.PinZu2);
    expect(haiIdToKindId(71 as HaiId)).toBe(HaiKind.PinZu9);
  });

  it("索子の範囲 (72-107) を正しく変換できる", () => {
    expect(haiIdToKindId(72 as HaiId)).toBe(HaiKind.SouZu1);
    expect(haiIdToKindId(75 as HaiId)).toBe(HaiKind.SouZu1);
    expect(haiIdToKindId(76 as HaiId)).toBe(HaiKind.SouZu2);
    expect(haiIdToKindId(107 as HaiId)).toBe(HaiKind.SouZu9);
  });

  it("字牌の範囲 (108-135) を正しく変換できる", () => {
    expect(haiIdToKindId(108 as HaiId)).toBe(HaiKind.Ton);
    expect(haiIdToKindId(111 as HaiId)).toBe(HaiKind.Ton); // 東の4枚目
    expect(haiIdToKindId(112 as HaiId)).toBe(HaiKind.Nan);
    expect(haiIdToKindId(135 as HaiId)).toBe(HaiKind.Chun); // 中の4枚目
  });
});

describe("haiKindToNumber", () => {
  it("数牌の数値を正しく取得できる", () => {
    expect(haiKindToNumber(HaiKind.ManZu1)).toBe(1);
    expect(haiKindToNumber(HaiKind.ManZu9)).toBe(9);
    expect(haiKindToNumber(HaiKind.PinZu1)).toBe(1);
    expect(haiKindToNumber(HaiKind.PinZu9)).toBe(9);
    expect(haiKindToNumber(HaiKind.SouZu1)).toBe(1);
    expect(haiKindToNumber(HaiKind.SouZu9)).toBe(9);
  });

  it("字牌の場合は undefined を返す", () => {
    expect(haiKindToNumber(HaiKind.Ton)).toBeUndefined();
    expect(haiKindToNumber(HaiKind.Chun)).toBeUndefined();
  });
});

describe("isSuupai", () => {
  it("萬子、筒子、索子は true を返す", () => {
    expect(isSuupai(HaiKind.ManZu1)).toBe(true);
    expect(isSuupai(HaiKind.PinZu5)).toBe(true);
    expect(isSuupai(HaiKind.SouZu9)).toBe(true);
  });

  it("字牌は false を返す", () => {
    expect(isSuupai(HaiKind.Ton)).toBe(false);
    expect(isSuupai(HaiKind.Chun)).toBe(false);
  });
});
