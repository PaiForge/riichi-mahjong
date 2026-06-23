import { describe, it, expect } from "vitest";
import { iipeikouDefinition } from "./iipeikou";
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

    expect(iipeikouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(iipeikouDefinition.getHansu(hand, mockContextMenzen)).toBe(1);
  });

  it("鳴きがある場合、条件を満たしていても翻数が0であること", () => {
    // 123m 123m 456p 22z [555s]
    const tehai = createTehai("123m123m456p22z[555s]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(iipeikouDefinition.getHansu(hand, mockContextOpen)).toBe(0);
  });

  it("同一順子がない場合、条件を満たさないこと", () => {
    // 123m 456m 456p 555s 22z
    const tehai = createTehai("123m456m456p555s22z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(iipeikouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
    expect(iipeikouDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("二盃口が成立する手牌では一盃口が成立しないこと（上位互換による排他）", () => {
    // 112233m 445566p 77s（二盃口の形）
    const tehai = createTehai("112233m445566p77s");
    const hands = getHouraStructuresForMentsuTe(tehai);

    // 全ての分解において一盃口が成立しないことを確認
    const hasIipeikou = hands.some((hand) =>
      iipeikouDefinition.isSatisfied(hand, mockContextMenzen),
    );

    expect(hasIipeikou).toBe(false);
  });

  it("同一色の二盃口が成立する手牌でも一盃口が成立しないこと", () => {
    // 112233s 778899s 11z（索子の同一色二盃口）
    const tehai = createTehai("112233778899s11z");
    const hands = getHouraStructuresForMentsuTe(tehai);

    const hasIipeikou = hands.some((hand) =>
      iipeikouDefinition.isSatisfied(hand, mockContextMenzen),
    );

    expect(hasIipeikou).toBe(false);
  });
});
