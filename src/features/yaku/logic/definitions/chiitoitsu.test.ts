import { describe, it, expect } from "vitest";
import { chiitoitsuDefinition } from "./chiitoitsu";
import { HouraStructure, HouraContext } from "../../types";
import { HaiKind } from "../../../../types";

describe("七対子", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    doraMarkers: [], // Dummy
  };

  it("手牌構造が七対子の場合、条件を満たすこと", () => {
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

    expect(chiitoitsuDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(chiitoitsuDefinition.getHansu(hand, mockContext)).toBe(2);
  });
});
