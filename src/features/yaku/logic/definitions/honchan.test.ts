import { describe, it, expect } from "vitest";
import { honchanDefinition } from "./honchan";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("混全帯幺九（ホンチャン）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("門前でホンチャンが成立する場合、2飜であること", () => {
    // 123m 123p 789s 999p 11z
    const tehai = createTehai("123m123p789s999p11z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(honchanDefinition.getHansu(hand, mockContextMenzen)).toBe(2);
  });

  it("副露してホンチャンが成立する場合、1飜であること", () => {
    // 123m 123p 789s [999p] (pon) 11z
    const tehai = createTehai("123m123p789s11z[999p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honchanDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(honchanDefinition.getHansu(hand, mockContextOpen)).toBe(1);
  });

  it("中張牌のみの面子が含まれる場合は不成立", () => {
    // 123m 456m 789s 999p 11z (456mがNG)
    const tehai = createTehai("123m456m789s999p11z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("順子が含まれない場合は不成立（混老頭になるため）", () => {
    // 111m 999p 111s 999s 22z
    const tehai = createTehai("111m999p111s999s22z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("字牌が含まれない場合は不成立（純全帯幺九になるため）", () => {
    // 123m 123p 789s 999p 11m (雀頭も1mで字牌なし)
    const tehai = createTehai("123m123p789s999p11m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honchanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });
});
