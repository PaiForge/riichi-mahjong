import { describe, it, expect } from "vitest";
import { chinitsuDefinition } from "./chinitsu";
import {
  createChiitoitsuStructureFromMspz,
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import type { HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("清一色（チンイツ）の判定", () => {
  const mockContextMenzen: HouraContext = createHouraContext();

  const mockContextOpen: HouraContext = createHouraContext({
    isMenzen: false,
  });

  it("萬子のチンイツ（門前）が成立する場合、6翻であること", () => {
    // 123m 456m 789m 111m 22m
    const hand = createMentsuStructureFromMspz("123m456m789m111m22m");

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(chinitsuDefinition.getHansu(hand, mockContextMenzen)).toBe(6);
  });

  it("筒子のチンイツ（副露）が成立する場合、5翻であること", () => {
    // 123p 456p 789p [111p] 22p (Pon)
    const hand = createMentsuStructureFromMspz("123p456p789p22p[111p]");

    expect(chinitsuDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(chinitsuDefinition.getHansu(hand, mockContextOpen)).toBe(5);
  });

  it("索子のチンイツでも成立すること", () => {
    // 111s 222s 333s 444s 55s
    const hand = createMentsuStructureFromMspz("111s222s333s444s55s");

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("七対子形でも成立すること", () => {
    // 11m 22m 33m 44m 55m 66m 77m
    const hand: HouraStructure =
      createChiitoitsuStructureFromMspz("11223344556677m");

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("字牌が含まれる場合は不成立（混一色）", () => {
    // 123m 456m 789m 111z 22z
    const hand = createMentsuStructureFromMspz("123m456m789m111z22z");

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("複数色の数牌が混ざっている場合は不成立", () => {
    // 123m 123p 456m 789m 55m
    const hand = createMentsuStructureFromMspz("123m123p456m789m55m");

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });
});
