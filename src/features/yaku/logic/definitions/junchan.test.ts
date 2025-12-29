import { describe, it, expect } from "vitest";
import { junchanDefinition } from "./junchan";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("純全帯幺九（ジュンチャン）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    doraMarkers: [], // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1,
    doraMarkers: [], // Dummy
  };

  it("門前でジュンチャンが成立する場合、3飜であること", () => {
    // 123m 123p 789s 999p 11m
    const tehai = createTehai("123m123p789s999p11m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(junchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(junchanDefinition.getHansu(hand, mockContextMenzen)).toBe(3);
  });

  it("副露してジュンチャンが成立する場合、2飜であること", () => {
    // 123m 123p 789s [999p] (pon) 11m
    const tehai = createTehai("123m123p789s11m[999p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(junchanDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(junchanDefinition.getHansu(hand, mockContextOpen)).toBe(2);
  });

  it("字牌が含まれる場合は不成立（ホンチャンになるため）", () => {
    // 123m 123p 789s 999p 11z (11zがNG)
    const tehai = createTehai("123m123p789s999p11z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(junchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("中張牌のみの面子が含まれる場合は不成立", () => {
    // 123m 456m 789s 999p 11m (456mがNG)
    const tehai = createTehai("123m456m789s999p11m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(junchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("順子が含まれない場合は不成立（清老頭になるため）", () => {
    // 111m 999p 111s 999s 11m
    const tehai = createTehai("111m999p111s999s11m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(junchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });
});
