import { describe, it, expect } from "vitest";
import { honitsuDefinition } from "./honitsu";
import {
  createChiitoitsuStructureFromMspz,
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import type { HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("混一色（ホンイツ）の判定", () => {
  const mockContextMenzen: HouraContext = createHouraContext();

  const mockContextOpen: HouraContext = createHouraContext({
    isMenzen: false,
  });

  it("萬子のホンイツ（門前）が成立する場合、3翻であること", () => {
    // 123m 456m 789m 111z 22z
    const hand = createMentsuStructureFromMspz("123m456m789m111z22z");

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(honitsuDefinition.getHansu(hand, mockContextMenzen)).toBe(3);
  });

  it("筒子のホンイツ（副露）が成立する場合、2翻であること", () => {
    // 123p 456p 789p 22z [111z] (Pon)
    const hand = createMentsuStructureFromMspz("123p456p789p22z[111z]");

    expect(honitsuDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(honitsuDefinition.getHansu(hand, mockContextOpen)).toBe(2);
  });

  it("索子のホンイツでも成立すること", () => {
    // 111s 222s 333s 444s 11z
    const hand = createMentsuStructureFromMspz("111s222s333s444s11z");

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("七対子形でも成立すること", () => {
    // 11m 22m 33m 44m 11z 22z 33z
    const hand: HouraStructure =
      createChiitoitsuStructureFromMspz("11223344m112233z");

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("字牌が含まれない場合は不成立（清一色）", () => {
    // 123m 456m 789m 111m 22m
    const hand = createMentsuStructureFromMspz("123m456m789m111m22m");

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("複数色の数牌が混ざっている場合は不成立", () => {
    // 123m 123p 111z 222z 33z
    const hand = createMentsuStructureFromMspz("123m123p111z222z33z");

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("数牌が含まれない場合は不成立（字一色）", () => {
    // 111z 222z 333z 444z 55z
    const hand = createMentsuStructureFromMspz("111z222z333z444z55z");

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });
});
