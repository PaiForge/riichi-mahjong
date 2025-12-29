import { describe, it, expect } from "vitest";
import { kokushiDefinition } from "./kokushi";
import type { HouraContext } from "../../types";
import { HaiKind } from "../../../../types";
import type { KokushiHouraStructure } from "../../types";

describe("国士無双の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    doraMarkers: [],
  };

  it("国士無双形の構造に対して成立すること", () => {
    const hand: KokushiHouraStructure = {
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
    expect(kokushiDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(kokushiDefinition.getHansu(hand, baseContext)).toBe(13);
  });
});
