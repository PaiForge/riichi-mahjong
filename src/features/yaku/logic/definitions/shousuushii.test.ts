import { describe, it, expect } from "vitest";
import { shousuushiiDefinition } from "./shousuushii";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind, type MentsuHouraStructure } from "../../../../types";
import type { HouraContext } from "../../types";

describe("小四喜（ショウスーシー）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.Ton, // Dummy
  };

  it("東・南・西の刻子と、北の雀頭がある場合、成立すること", () => {
    // 111z(東), 222z(南), 333z(西), 44z(北), 555p
    const tehai = createTehai("111z222z333z44z555p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(shousuushiiDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(shousuushiiDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("副露していても成立すること", () => {
    // 111z(東), 222z(南), 44z(北雀頭), 555p, [333z](西ポン)
    const tehai = createTehai("111z222z44z555p[333z]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(shousuushiiDefinition.isSatisfied(hand, context)).toBe(true);
    expect(shousuushiiDefinition.getHansu(hand, context)).toBe(13);
  });

  it("風牌の刻子が2つしかない場合は不成立", () => {
    // 111z(東), 222z(南), 44z(北雀頭), 555p, 666s
    const tehai = createTehai("111z222z44z555p666s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(shousuushiiDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("大四喜（風牌の刻子4つ）の場合は不成立（構造的に雀頭が風牌になり得ないため）", () => {
    // 111z, 222z, 333z, 444z, 55m
    const tehai = createTehai("111z222z333z444z55m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(shousuushiiDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
