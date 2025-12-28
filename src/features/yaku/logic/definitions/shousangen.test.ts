import { describe, it, expect } from "vitest";
import { shousangenDefinition } from "./shousangen";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind, type MentsuHouraStructure } from "../../../../types";
import type { HouraContext } from "../../types";

describe("小三元（ショウサンゲン）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("白・發の刻子と、中の対子がある場合、成立すること", () => {
    // 555z (白), 666z (發), 77z (中), 123m, 456p
    const tehai = createTehai("123m456p555z666z77z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(shousangenDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(shousangenDefinition.getHansu(hand, mockContext)).toBe(2);
  });

  it("副露していても成立すること", () => {
    // 555z (白), 77z (中), 123m, 456p, [666z] (發ポン)
    const tehai = createTehai("123m456p555z77z[666z]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(shousangenDefinition.isSatisfied(hand, context)).toBe(true);
    expect(shousangenDefinition.getHansu(hand, context)).toBe(2);
  });

  it("三元牌の刻子が1つしかない場合は不成立", () => {
    // 555z (白), 77z (中), 123m, 456p, 789s (刻子が足りない)
    const tehai = createTehai("123m456p789s555z77z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(shousangenDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("三元牌の刻子が2つあるが、雀頭が三元牌でない場合は不成立", () => {
    // 555z (白), 666z (發), 11m (雀頭), 123p, 456s
    const tehai = createTehai("11m123p456s555z666z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(shousangenDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("大三元（三元牌の刻子3つ）の場合は不成立（構造的に雀頭が三元牌になり得ないため）", () => {
    // 555z (白), 666z (發), 777z (中), 11m, 123p
    const tehai = createTehai("11m123p555z666z777z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    // 刻子数は3、雀頭は1mなので条件(count===2 && jantou===sangen)を満たさない
    expect(shousangenDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
