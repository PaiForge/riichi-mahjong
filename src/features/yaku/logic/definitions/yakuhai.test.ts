import { describe, it, expect } from "vitest";
import { hakuDefinition, hatsuDefinition, chunDefinition } from "./yakuhai";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("役牌（三元牌）の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu4, // Irrelevant for Yakuhai check usually, but needed for context
  };

  it("白が成立する場合（刻子）", () => {
    // 555z (Haku) + others
    const tehai = createTehai("555z234m456p789s11p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(hakuDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(hakuDefinition.getHansu(hand, baseContext)).toBe(1);

    // 他の三元牌は不成立
    expect(hatsuDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(chunDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });

  it("白が成立する場合（鳴き）", () => {
    // 555z (Haku) pon
    const tehai = createTehai("234m456p789s11p[555z]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    const context = { ...baseContext, isMenzen: false };
    expect(hakuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(hakuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("發が成立する場合", () => {
    const tehai = createTehai("666z234m456p789s11p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(hatsuDefinition.isSatisfied(hand, baseContext)).toBe(true);
  });

  it("中が成立する場合", () => {
    const tehai = createTehai("777z234m456p789s11p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chunDefinition.isSatisfied(hand, baseContext)).toBe(true);
  });

  it("対子では不成立", () => {
    // 55z (pair)
    const tehai = createTehai("55z234m456p789s111p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(hakuDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });
});
