import { describe, it, expect } from "vitest";
import { ikkitsuukanDefinition } from "./ikkitsuukan";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind, type MentsuHouraStructure } from "../../../../types";
import type { HouraContext } from "../../types";

describe("一気通貫の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("門前で一気通貫が成立する場合、2飜であること", () => {
    // 123m 456m 789m 123p 99p
    const tehai = createTehai("123m456m789m123p99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ikkitsuukanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      true,
    );
    expect(ikkitsuukanDefinition.getHansu(hand, mockContextMenzen)).toBe(2);
  });

  it("鳴きありで一気通貫が成立する場合、1飜であること", () => {
    // 123p 456p 123s 99s [789p] (chi)
    const tehai = createTehai("123p456p123s99s[789p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ikkitsuukanDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(ikkitsuukanDefinition.getHansu(hand, mockContextOpen)).toBe(1);
  });

  it("色が揃っていない場合は不成立（一部色が違う）", () => {
    // 123m 456m 789p 123s 99s
    const tehai = createTehai("123m456m789p123s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ikkitsuukanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
    expect(ikkitsuukanDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("数字が揃っていない場合は不成立（欠けがある）", () => {
    // 123m 456m 456m 123s 99s
    const tehai = createTehai("123m456m456m123s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ikkitsuukanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
    expect(ikkitsuukanDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("順子が3つ未満の場合は不成立", () => {
    // 123m 456m 777m 123s 99p (順子2つ、刻子1つ)
    const tehai = createTehai("123m456m777m123s99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ikkitsuukanDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
