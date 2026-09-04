import { describe, it, expect } from "vitest";
import { compareHouraRankingKeys, type HouraRankingKey } from "./compare";

describe("和了解釈の比較 (compareHouraRankingKeys)", () => {
  const key = (
    basePoints: number,
    han: number,
    fu: HouraRankingKey["fu"],
  ): HouraRankingKey => ({ basePoints, han, fu });

  it("基本点が高い解釈を優先すること", () => {
    // 2翻40符 (基本点 640) と 2翻30符 (基本点 480)
    expect(
      compareHouraRankingKeys(key(640, 2, 40), key(480, 2, 30)),
    ).toBeGreaterThan(0);
    expect(
      compareHouraRankingKeys(key(480, 2, 30), key(640, 2, 40)),
    ).toBeLessThan(0);
  });

  it("翻数が低くても基本点が高ければ優先すること", () => {
    // 1翻70符 (基本点 560) と 2翻30符 (基本点 480)
    expect(
      compareHouraRankingKeys(key(560, 1, 70), key(480, 2, 30)),
    ).toBeGreaterThan(0);
  });

  it("基本点が同じなら翻数が高い解釈を優先すること", () => {
    // 2翻30符 と 1翻60符 はいずれも基本点 480 だが、翻数の高い前者を採る
    expect(
      compareHouraRankingKeys(key(480, 2, 30), key(480, 1, 60)),
    ).toBeGreaterThan(0);
  });

  it("基本点・翻数が同じなら符が高い解釈を優先すること", () => {
    // 満貫以上では符が異なっても基本点が同じになるため、符でタイブレークする
    expect(
      compareHouraRankingKeys(key(8000, 10, 40), key(8000, 10, 30)),
    ).toBeGreaterThan(0);
  });

  it("すべて同じなら優劣がつかないこと（0 を返す）", () => {
    expect(compareHouraRankingKeys(key(480, 2, 30), key(480, 2, 30))).toBe(0);
  });
});
