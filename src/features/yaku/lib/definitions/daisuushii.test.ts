import { describe, it, expect } from "vitest";
import { daisuushiiDefinition } from "./daisuushii";
import {
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("大四喜（ダイスーシー）の判定", () => {
  const mockContext: HouraContext = createHouraContext({
    agariHai: HaiKind.Ton,
  });

  it("東・南・西・北の全ての刻子がある場合、成立すること", () => {
    // 111z(東), 222z(南), 333z(西), 444z(北), 55m
    const hand = createMentsuStructureFromMspz("111z222z333z444z55m");

    expect(daisuushiiDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(daisuushiiDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("副露していても成立すること", () => {
    // 111z(東), 222z(南), 333z(西), 55m, [444z](北ポン)
    const hand = createMentsuStructureFromMspz("111z222z333z55m[444z]");
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(daisuushiiDefinition.isSatisfied(hand, context)).toBe(true);
    expect(daisuushiiDefinition.getHansu(hand, context)).toBe(13);
  });

  it("大四喜ダブルルール有効なら26翻（ダブル役満）であること", () => {
    const hand = createMentsuStructureFromMspz("111z222z333z444z55m");
    const context: HouraContext = {
      ...mockContext,
      yakumanRuleConfig: { daisuushii: true },
    };

    expect(daisuushiiDefinition.getHansu(hand, context)).toBe(26);
  });

  it("大四喜ダブルルール有効なら副露していても26翻であること", () => {
    const hand = createMentsuStructureFromMspz("111z222z333z55m[444z]");
    const context: HouraContext = {
      ...mockContext,
      isMenzen: false,
      yakumanRuleConfig: { daisuushii: true },
    };

    expect(daisuushiiDefinition.getHansu(hand, context)).toBe(26);
  });

  it("小四喜（風牌の刻子3つ＋雀頭）の場合は不成立", () => {
    // 111z(東), 222z(南), 333z(西), 44z(北雀頭), 555p
    const hand = createMentsuStructureFromMspz("111z222z333z44z555p");

    expect(daisuushiiDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("風牌の刻子が3つ以下の場合は不成立", () => {
    // 111z, 222z, 333z, 555p, 66m
    const hand = createMentsuStructureFromMspz("111z222z333z555p66m");

    expect(daisuushiiDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
