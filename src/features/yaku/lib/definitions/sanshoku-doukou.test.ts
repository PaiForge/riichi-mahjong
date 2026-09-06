import { describe, it, expect } from "vitest";
import { sanshokuDoukouDefinition } from "./sanshoku-doukou";
import { createMentsuStructureFromMspz } from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("三色同刻（サンショクドウコウ）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [], // Dummy
  };

  it("萬子・筒子・索子の同じ数字の刻子がある場合、成立すること", () => {
    // 222m, 222p, 222s, 123s, 99m
    const hand = createMentsuStructureFromMspz("222m222p222s123s99m");

    expect(sanshokuDoukouDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(sanshokuDoukouDefinition.getHansu(hand, mockContext)).toBe(2);
  });

  it("副露していても成立すること", () => {
    // 222m, 222s, 88p, 555z, [222p](ポン)
    const hand = createMentsuStructureFromMspz("222m222s88p555z[222p]");
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(sanshokuDoukouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(sanshokuDoukouDefinition.getHansu(hand, context)).toBe(2);
  });

  it("数字が揃っていない場合は不成立", () => {
    // 222m, 222p, 333s, 123m, 99p
    const hand = createMentsuStructureFromMspz("123m222m99p222p333s");

    expect(sanshokuDoukouDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("2色しかない場合は不成立", () => {
    // 222m, 222p, 222m (萬子の2が2つ...ありえないが論理的には不成立), 実際には4面子
    // 222m, 222p, 456s, 789s, 11z
    const hand = createMentsuStructureFromMspz("222m222p456s789s11z");

    expect(sanshokuDoukouDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
