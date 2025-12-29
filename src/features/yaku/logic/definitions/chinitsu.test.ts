import { describe, it, expect } from "vitest";
import { chinitsuDefinition } from "./chinitsu";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure, HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("清一色（チンイツ）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("萬子のチンイツ（門前）が成立する場合、6飜であること", () => {
    // 123m 456m 789m 111m 22m
    const tehai = createTehai("123m456m789m111m22m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(chinitsuDefinition.getHansu(hand, mockContextMenzen)).toBe(6);
  });

  it("筒子のチンイツ（副露）が成立する場合、5飜であること", () => {
    // 123p 456p 789p [111p] 22p (Pon)
    const tehai = createTehai("123p456p789p22p[111p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinitsuDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(chinitsuDefinition.getHansu(hand, mockContextOpen)).toBe(5);
  });

  it("索子のチンイツでも成立すること", () => {
    // 111s 222s 333s 444s 55s
    const tehai = createTehai("111s222s333s444s55s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("七対子形でも成立すること", () => {
    // 11m 22m 33m 44m 55m 66m 77m
    const hand: HouraStructure = {
      type: "Chiitoitsu",
      pairs: [
        { type: "Toitsu", hais: [HaiKind.ManZu1, HaiKind.ManZu1] },
        { type: "Toitsu", hais: [HaiKind.ManZu2, HaiKind.ManZu2] },
        { type: "Toitsu", hais: [HaiKind.ManZu3, HaiKind.ManZu3] },
        { type: "Toitsu", hais: [HaiKind.ManZu4, HaiKind.ManZu4] },
        { type: "Toitsu", hais: [HaiKind.ManZu5, HaiKind.ManZu5] },
        { type: "Toitsu", hais: [HaiKind.ManZu6, HaiKind.ManZu6] },
        { type: "Toitsu", hais: [HaiKind.ManZu7, HaiKind.ManZu7] },
      ],
    };

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("字牌が含まれる場合は不成立（混一色）", () => {
    // 123m 456m 789m 111z 22z
    const tehai = createTehai("123m456m789m111z22z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("複数色の数牌が混ざっている場合は不成立", () => {
    // 123m 123p 456m 789m 55m
    const tehai = createTehai("123m123p456m789m55m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });
});
