import { describe, it, expect } from "vitest";
import { chiitoitsuDefinition } from "./chiitoitsu";
import { HouraStructure, HouraContext } from "../../types";
import { HaiKind } from "../../../../types";

describe("七対子", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
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

  it("手牌構造が面子手の場合、条件を満たさないこと", () => {
    const hand: HouraStructure = {
      type: "Mentsu",
      jantou: { type: "Toitsu", hais: [HaiKind.ManZu1, HaiKind.ManZu1] },
      fourMentsu: [
        {
          type: "Shuntsu",
          hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
        },
        {
          type: "Shuntsu",
          hais: [HaiKind.PinZu2, HaiKind.PinZu3, HaiKind.PinZu4],
        },
        {
          type: "Shuntsu",
          hais: [HaiKind.SouZu2, HaiKind.SouZu3, HaiKind.SouZu4],
        },
        { type: "Koutsu", hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton] },
      ],
    };

    expect(chiitoitsuDefinition.isSatisfied(hand, mockContext)).toBe(false);
    expect(chiitoitsuDefinition.getHansu(hand, mockContext)).toBe(0);
  });

  it("手牌構造が国士無双の場合、条件を満たさないこと", () => {
    const hand: HouraStructure = {
      type: "Kokushi",
      yaochu: [
        HaiKind.ManZu1,
        HaiKind.ManZu9,
        HaiKind.PinZu1,
        HaiKind.PinZu9,
        HaiKind.SouZu1,
        HaiKind.SouZu9,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Sha,
        HaiKind.Pei,
        HaiKind.Haku,
        HaiKind.Hatsu,
        HaiKind.Chun,
      ],
      jantou: HaiKind.ManZu1,
    };

    expect(chiitoitsuDefinition.isSatisfied(hand, mockContext)).toBe(false);
    expect(chiitoitsuDefinition.getHansu(hand, mockContext)).toBe(0);
  });
});
