import { describe, it, expect } from "vitest";
import { suukantsuDefinition } from "./suukantsu";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("四槓子（スーカンツ）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("槓子が4つある場合、成立すること", () => {
    // [1111m], [2222p], [3333s], [4444z], 99p (単騎待ち)
    // 通常は単騎待ち等のアガリ形になる
    const tehai = createTehai("99p[1111m][2222p][3333s][4444z]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(suukantsuDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(suukantsuDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("槓子が3つ以下の場合は不成立", () => {
    // [1111m], [2222p], [3333s], 123m, 99p
    const tehai = createTehai("123m99p[1111m][2222p][3333s]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(suukantsuDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
