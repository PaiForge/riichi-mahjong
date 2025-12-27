import { describe, it, expect } from "vitest";
import { honroutouDefinition } from "./honroutou";
import { createTehai } from "../../../../utils/test-helpers";
import { decomposeTehaiForMentsu } from "../structures/mentsu";
import {
  HaiKind,
  type MentsuHouraStructure,
  type HouraStructure,
} from "../../../../types";
import type { HouraContext } from "../../types";

describe("混老頭（ホンロウトウ）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("対々和形で条件を満たす場合、成立すること", () => {
    // 111m 999p 111s 999s 11z
    const tehai = createTehai("111m999p111s999s11z");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(honroutouDefinition.getHansu(hand, mockContextMenzen)).toBe(2);
  });

  it("鳴きありでも成立すること", () => {
    // 111m 999p 111s 11z [999s] (Pon)
    const tehai = createTehai("111m999p111s11z[999s]");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honroutouDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(honroutouDefinition.getHansu(hand, mockContextOpen)).toBe(2);
  });

  it("七対子形で条件を満たす場合、成立すること", () => {
    // 11m 99m 11p 99p 11s 99s 77z
    const hand: HouraStructure = {
      type: "Chiitoitsu",
      pairs: [
        { type: "Toitsu", hais: [HaiKind.ManZu1, HaiKind.ManZu1] },
        { type: "Toitsu", hais: [HaiKind.ManZu9, HaiKind.ManZu9] },
        { type: "Toitsu", hais: [HaiKind.PinZu1, HaiKind.PinZu1] },
        { type: "Toitsu", hais: [HaiKind.PinZu9, HaiKind.PinZu9] },
        { type: "Toitsu", hais: [HaiKind.SouZu1, HaiKind.SouZu1] },
        { type: "Toitsu", hais: [HaiKind.SouZu9, HaiKind.SouZu9] },
        { type: "Toitsu", hais: [HaiKind.Chun, HaiKind.Chun] },
      ],
    };

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
  });

  it("順子が含まれる場合は不成立（ホンチャン）", () => {
    // 123m 999p 111s 999s 11z (123mがNG)
    const tehai = createTehai("123m999p111s999s11z");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("字牌が含まれない場合は不成立（清老頭）", () => {
    // 111m 999p 111s 999s 11m (11mがNG)
    const tehai = createTehai("111m999p111s999s11m");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("中張牌が含まれる場合は不成立", () => {
    // 111m 222p 111s 999s 11z (222pがNG)
    const tehai = createTehai("111m222p111s999s11z");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
