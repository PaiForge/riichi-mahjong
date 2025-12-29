import { describe, it, expect } from "vitest";
import { honitsuDefinition } from "./honitsu";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure, HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("混一色（ホンイツ）の判定", () => {
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

  it("萬子のホンイツ（門前）が成立する場合、3飜であること", () => {
    // 123m 456m 789m 111z 22z
    const tehai = createTehai("123m456m789m111z22z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(honitsuDefinition.getHansu(hand, mockContextMenzen)).toBe(3);
  });

  it("筒子のホンイツ（副露）が成立する場合、2飜であること", () => {
    // 123p 456p 789p 22z [111z] (Pon)
    const tehai = createTehai("123p456p789p22z[111z]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honitsuDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(honitsuDefinition.getHansu(hand, mockContextOpen)).toBe(2);
  });

  it("索子のホンイツでも成立すること", () => {
    // 111s 222s 333s 444s 11z
    const tehai = createTehai("111s222s333s444s11z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("七対子形でも成立すること", () => {
    // 11m 22m 33m 44m 11z 22z 33z
    const hand: HouraStructure = {
      type: "Chiitoitsu",
      pairs: [
        { type: "Toitsu", hais: [HaiKind.ManZu1, HaiKind.ManZu1] },
        { type: "Toitsu", hais: [HaiKind.ManZu2, HaiKind.ManZu2] },
        { type: "Toitsu", hais: [HaiKind.ManZu3, HaiKind.ManZu3] },
        { type: "Toitsu", hais: [HaiKind.ManZu4, HaiKind.ManZu4] },
        { type: "Toitsu", hais: [HaiKind.Ton, HaiKind.Ton] },
        { type: "Toitsu", hais: [HaiKind.Nan, HaiKind.Nan] },
        { type: "Toitsu", hais: [HaiKind.Sha, HaiKind.Sha] },
      ],
    };

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("字牌が含まれない場合は不成立（清一色）", () => {
    // 123m 456m 789m 111m 22m
    const tehai = createTehai("123m456m789m111m22m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("複数色の数牌が混ざっている場合は不成立", () => {
    // 123m 123p 111z 222z 33z
    const tehai = createTehai("123m123p111z222z33z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });

  it("数牌が含まれない場合は不成立（字一色）", () => {
    // 111z 222z 333z 444z 55z
    const tehai = createTehai("111z222z333z444z55z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honitsuDefinition.isSatisfied(hand, mockContextMenzen)).toBe(false);
  });
});
