import { describe, it, expect } from "vitest";
import { sanshokuDoujunDefinition } from "./sanshoku-doujun";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("三色同順の判定", () => {
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

  it("門前で三色同順が成立する場合、2飜であること", () => {
    // 123m 123p 123s 789p 99p
    const tehai = createTehai("123m123p123s789p99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      true,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextMenzen)).toBe(2);
  });

  it("鳴きありで三色同順が成立する場合、1飜であること", () => {
    // 123m 123p 789p 99p [123s]
    const tehai = createTehai("123m123p789p99p[123s]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextOpen)).toBe(
      true,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextOpen)).toBe(1);
  });

  it("色が揃っていない場合は不成立（2色のみ）", () => {
    // 123m 123p 456s 789s 99p
    const tehai = createTehai("123m123p456s789s99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("数字が揃っていない場合は不成立", () => {
    // 123m 123p 234s 789p 99p
    const tehai = createTehai("123m123p234s789p99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("順子が3つ未満の場合は不成立（刻子が含まれる）", () => {
    // 123m 123p 111s 789p 99p
    const tehai = createTehai("123m123p111s789p99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
