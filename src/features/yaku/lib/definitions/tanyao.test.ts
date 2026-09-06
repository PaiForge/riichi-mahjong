import { describe, it, expect } from "vitest";
import { tanyaoDefinition } from "./tanyao";
import {
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("タンヤオの判定", () => {
  const baseContext: HouraContext = createHouraContext({
    agariHai: HaiKind.ManZu4,
  });

  it("タンヤオが成立する場合（門前）", () => {
    // 234m 234p 234s 678s 88p
    const hand = createMentsuStructureFromMspz("234m234p234s678s88p");

    expect(tanyaoDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(tanyaoDefinition.getHansu(hand, baseContext)).toBe(1);
  });

  it("タンヤオが成立する場合（鳴きあり）", () => {
    // 234m 234p 234s 88p [678s] (Chi)
    const hand = createMentsuStructureFromMspz("234m234p234s88p[678s]");

    const context = { ...baseContext, isMenzen: false };

    expect(tanyaoDefinition.isSatisfied(hand, context)).toBe(true);
    expect(tanyaoDefinition.getHansu(hand, context)).toBe(1); // 喰い下がりなし
  });

  it("一九字牌が含まれる場合は不成立（順子に么九牌）", () => {
    // 123m 234p 234s 678s 88p (123mがNG)
    const hand = createMentsuStructureFromMspz("123m234p234s678s88p");

    expect(tanyaoDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(tanyaoDefinition.getHansu(hand, baseContext)).toBe(0);
  });

  it("一九字牌が含まれる場合は不成立（雀頭が么九牌）", () => {
    // 234m 234p 234s 678s 99p (99pがNG)
    const hand = createMentsuStructureFromMspz("234m234p234s678s99p");

    expect(tanyaoDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(tanyaoDefinition.getHansu(hand, baseContext)).toBe(0);
  });

  it("一九字牌が含まれる場合は不成立（刻子に么九牌）", () => {
    // 234m 999p 234s 678s 88p (999pがNG)
    const hand = createMentsuStructureFromMspz("234m999p234s678s88p");

    expect(tanyaoDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(tanyaoDefinition.getHansu(hand, baseContext)).toBe(0);
  });

  it("字牌が含まれる場合は不成立", () => {
    // 234m 234p 234s 678s 11z (東が雀頭)
    const hand = createMentsuStructureFromMspz("234m234p234s678s11z");

    expect(tanyaoDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(tanyaoDefinition.getHansu(hand, baseContext)).toBe(0);
  });
});
