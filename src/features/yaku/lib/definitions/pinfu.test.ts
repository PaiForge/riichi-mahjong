import { describe, it, expect } from "vitest";
import { pinfuDefinition } from "./pinfu";
import {
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("平和の判定", () => {
  const baseContext: HouraContext = createHouraContext({
    agariHai: HaiKind.ManZu4,
  });

  it("条件を満たす場合、正しく判定されること", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s99s");
    const context = {
      ...baseContext,
      agariHai: HaiKind.SouZu4,
      doraMarkers: [],
    };

    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("門前でない場合は成立しないこと", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s99s");
    const context = {
      ...baseContext,
      isMenzen: false,
      agariHai: HaiKind.SouZu4,
      doraMarkers: [],
    };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が三元牌の場合は成立しないこと", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s55z"); // 白
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が場風の場合は成立しないこと", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s11z"); // 東
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が自風の場合は成立しないこと", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s22z"); // 南
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭がオタ風の場合は成立すること", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s33z"); // 西
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("待ちが両面ではない場合は成立しないこと", () => {
    const hand = createMentsuStructureFromMspz("123m456m789p234s99s");
    const context = { ...baseContext, agariHai: HaiKind.SouZu3 }; // 3s
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });
});
