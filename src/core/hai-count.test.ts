import { describe, expect, it } from "vitest";
import { HAI_KIND_IDS, HaiKind } from "../types";
import { canStartShuntsuAt, countHaiKind, shuntsuKindsAt } from "./hai-count";

describe("countHaiKind (牌種ごとの枚数分布)", () => {
  it("長さ 34 の分布を返し、渡した牌種の枚数を数える", () => {
    const counts = countHaiKind([HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.Ton]);
    expect(counts).toHaveLength(34);
    expect(counts[HaiKind.ManZu1]).toBe(2);
    expect(counts[HaiKind.Ton]).toBe(1);
    expect(counts[HaiKind.ManZu2]).toBe(0);
  });
});

describe("canStartShuntsuAt (順子の開始位置判定)", () => {
  it("数牌の 1〜7 は順子の開始位置になり得る", () => {
    expect(canStartShuntsuAt(HaiKind.ManZu1)).toBe(true);
    expect(canStartShuntsuAt(HaiKind.PinZu7)).toBe(true);
    expect(canStartShuntsuAt(HaiKind.SouZu7)).toBe(true);
  });

  it("数牌の 8・9 と字牌は順子の開始位置になり得ない", () => {
    expect(canStartShuntsuAt(HaiKind.ManZu8)).toBe(false);
    expect(canStartShuntsuAt(HaiKind.SouZu9)).toBe(false);
    expect(canStartShuntsuAt(HaiKind.Ton)).toBe(false);
    expect(canStartShuntsuAt(HaiKind.Chun)).toBe(false);
  });
});

describe("shuntsuKindsAt (順子 3 牌の牌種ID)", () => {
  it("順子の開始位置なら kind, kind+1, kind+2 を返す", () => {
    expect(shuntsuKindsAt(HaiKind.ManZu1)).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
    ]);
    expect(shuntsuKindsAt(HaiKind.SouZu7)).toEqual([
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.SouZu9,
    ]);
  });

  it("順子の開始位置になり得ない牌種は undefined を返す", () => {
    expect(shuntsuKindsAt(HaiKind.ManZu8)).toBeUndefined();
    expect(shuntsuKindsAt(HaiKind.PinZu9)).toBeUndefined();
    expect(shuntsuKindsAt(HaiKind.Ton)).toBeUndefined();
  });

  it("全牌種について canStartShuntsuAt と結果の有無が一致する", () => {
    for (const kind of HAI_KIND_IDS) {
      expect(shuntsuKindsAt(kind) !== undefined).toBe(canStartShuntsuAt(kind));
    }
  });
});
