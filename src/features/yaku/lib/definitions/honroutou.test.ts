import { describe, it, expect } from "vitest";
import { honroutouDefinition } from "./honroutou";
import {
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("混老頭（ホンロウトウ）の判定", () => {
  const mockContextMenzen: HouraContext = createHouraContext();

  const mockContextOpen: HouraContext = createHouraContext({
    isMenzen: false,
  });

  it("対々和形で条件を満たす場合、成立すること", () => {
    // 111m 999p 111s 999s 11z
    const hand = createMentsuStructureFromMspz("111m999p111s999s11z");

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(true);
    expect(honroutouDefinition.getHansu(hand, mockContextMenzen)).toBe(2);
  });

  it("鳴きありでも成立すること", () => {
    // 111m 999p 111s 11z [999s] (Pon)
    const hand = createMentsuStructureFromMspz("111m999p111s11z[999s]");

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
    const hand = createMentsuStructureFromMspz("123m999p111s999s11z");

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("字牌が含まれない場合は不成立（清老頭）", () => {
    // 111m 999p 111s 999s 99m (字牌がないのでNG)
    const hand = createMentsuStructureFromMspz("111m999p111s999s99m");

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("中張牌が含まれる場合は不成立", () => {
    // 111m 222p 111s 999s 11z (222pがNG)
    const hand = createMentsuStructureFromMspz("111m222p111s999s11z");

    expect(honroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
