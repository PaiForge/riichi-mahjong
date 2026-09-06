import { describe, expect, it } from "vitest";
import { type HaiId, HaiKind, HaiType } from "../types";
import {
  haiIdToKindId,
  haiKindToNumber,
  isJihai,
  isKazehai,
  isRoutou,
  isSuupai,
  kindIdToHaiType,
  kindIdToSuitIndex,
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

describe("isJihai", () => {
  it("字牌は true を返す", () => {
    expect(isJihai(HaiKind.Ton)).toBe(true);
    expect(isJihai(HaiKind.Haku)).toBe(true);
    expect(isJihai(HaiKind.Chun)).toBe(true);
  });

  it("数牌は false を返す", () => {
    expect(isJihai(HaiKind.ManZu1)).toBe(false);
    expect(isJihai(HaiKind.PinZu5)).toBe(false);
    expect(isJihai(HaiKind.SouZu9)).toBe(false);
  });
});

describe("kindIdToSuitIndex", () => {
  it("萬子は 0 を返す", () => {
    expect(kindIdToSuitIndex(HaiKind.ManZu1)).toBe(0);
    expect(kindIdToSuitIndex(HaiKind.ManZu9)).toBe(0);
  });

  it("筒子は 1 を返す", () => {
    expect(kindIdToSuitIndex(HaiKind.PinZu1)).toBe(1);
    expect(kindIdToSuitIndex(HaiKind.PinZu9)).toBe(1);
  });

  it("索子は 2 を返す", () => {
    expect(kindIdToSuitIndex(HaiKind.SouZu1)).toBe(2);
    expect(kindIdToSuitIndex(HaiKind.SouZu9)).toBe(2);
  });

  it("字牌は undefined を返す", () => {
    expect(kindIdToSuitIndex(HaiKind.Ton)).toBeUndefined();
    expect(kindIdToSuitIndex(HaiKind.Chun)).toBeUndefined();
  });
});

describe("isRoutou", () => {
  it("数牌の1と9は true を返す", () => {
    expect(isRoutou(HaiKind.ManZu1)).toBe(true);
    expect(isRoutou(HaiKind.ManZu9)).toBe(true);
    expect(isRoutou(HaiKind.PinZu1)).toBe(true);
    expect(isRoutou(HaiKind.PinZu9)).toBe(true);
    expect(isRoutou(HaiKind.SouZu1)).toBe(true);
    expect(isRoutou(HaiKind.SouZu9)).toBe(true);
  });

  it("中張牌は false を返す", () => {
    expect(isRoutou(HaiKind.ManZu2)).toBe(false);
    expect(isRoutou(HaiKind.PinZu5)).toBe(false);
    expect(isRoutou(HaiKind.SouZu8)).toBe(false);
  });

  it("字牌は么九牌だが老頭牌ではないため false を返す", () => {
    expect(isRoutou(HaiKind.Ton)).toBe(false);
    expect(isRoutou(HaiKind.Haku)).toBe(false);
    expect(isRoutou(HaiKind.Chun)).toBe(false);
  });
});

describe("isKazehai", () => {
  it("東・南・西・北は true を返す", () => {
    expect(isKazehai(HaiKind.Ton)).toBe(true);
    expect(isKazehai(HaiKind.Nan)).toBe(true);
    expect(isKazehai(HaiKind.Sha)).toBe(true);
    expect(isKazehai(HaiKind.Pei)).toBe(true);
  });

  it("三元牌は字牌だが風牌ではないため false を返す", () => {
    expect(isKazehai(HaiKind.Haku)).toBe(false);
    expect(isKazehai(HaiKind.Hatsu)).toBe(false);
    expect(isKazehai(HaiKind.Chun)).toBe(false);
  });

  it("数牌は false を返す", () => {
    expect(isKazehai(HaiKind.ManZu1)).toBe(false);
    expect(isKazehai(HaiKind.SouZu9)).toBe(false);
  });
});
