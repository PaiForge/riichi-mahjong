import { describe, it, expect } from "vitest";
import { iipeikoDefinition } from "./iipeiko";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("一盃口の判定", () => {
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

  it("条件を満たす場合、正しく判定されること", () => {
    // 123m 123m 456p 555s 22z
    const tehai = createTehai("123m123m456p555s22z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(iipeikoDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(iipeikoDefinition.getHansu(hand, mockContextMenzen)).toBe(1);
  });

  it("鳴きがある場合、条件を満たしていても飜数が0であること", () => {
    // 123m 123m 456p 22z [555s]
    const tehai = createTehai("123m123m456p22z[555s]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(iipeikoDefinition.getHansu(hand, mockContextOpen)).toBe(0);
  });

  it("同一順子がない場合、条件を満たさないこと", () => {
    // 123m 456m 456p 555s 22z
    const tehai = createTehai("123m456m456p555s22z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(iipeikoDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
    expect(iipeikoDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });
});
