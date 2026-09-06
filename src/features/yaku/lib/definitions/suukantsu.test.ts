import { describe, it, expect } from "vitest";
import { suukantsuDefinition } from "./suukantsu";
import {
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import type { HouraContext } from "../../types";

describe("四槓子（スーカンツ）の判定", () => {
  const mockContext: HouraContext = createHouraContext();

  it("槓子が4つある場合、成立すること", () => {
    // [1111m], [2222p], [3333s], [4444z], 99p (単騎待ち)
    // 通常は単騎待ち等のアガリ形になる
    const hand = createMentsuStructureFromMspz(
      "99p[1111m][2222p][3333s][4444z]",
    );

    expect(suukantsuDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(suukantsuDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("槓子が3つ以下の場合は不成立", () => {
    // [1111m], [2222p], [3333s], 789m, 99p
    const hand = createMentsuStructureFromMspz("789m99p[1111m][2222p][3333s]");

    expect(suukantsuDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
