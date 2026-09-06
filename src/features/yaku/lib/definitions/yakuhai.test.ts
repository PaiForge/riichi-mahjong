import { describe, it, expect } from "vitest";
import {
  hakuDefinition,
  hatsuDefinition,
  chunDefinition,
  bakazeDefinition,
  jikazeDefinition,
} from "./yakuhai";
import { createMentsuStructureFromMspz } from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("役牌（三元牌）の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu4,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [],
  };

  it("白が成立する場合（刻子）", () => {
    // 555z (Haku) + others
    const hand = createMentsuStructureFromMspz("555z234m456p789s11p");

    expect(hakuDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(hakuDefinition.getHansu(hand, baseContext)).toBe(1);

    // 他の三元牌は不成立
    expect(hatsuDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(chunDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });

  it("白が成立する場合（鳴き）", () => {
    // 555z (Haku) pon
    const hand = createMentsuStructureFromMspz("234m456p789s11p[555z]");

    const context = { ...baseContext, isMenzen: false };
    expect(hakuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(hakuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("發が成立する場合", () => {
    const hand = createMentsuStructureFromMspz("666z234m456p789s11p");

    expect(hatsuDefinition.isSatisfied(hand, baseContext)).toBe(true);
  });

  it("中が成立する場合", () => {
    const hand = createMentsuStructureFromMspz("777z234m456p789s11p");

    expect(chunDefinition.isSatisfied(hand, baseContext)).toBe(true);
  });

  it("対子では不成立", () => {
    // 55z (pair)
    const hand = createMentsuStructureFromMspz("55z234m456p789s111p");

    expect(hakuDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });
});

describe("役牌（風牌）の判定", () => {
  /** 東場・南家 */
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu4,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [],
  };

  it("場風の刻子で場風が成立し、自風は不成立", () => {
    // 東場・南家で 111z（東）
    const hand = createMentsuStructureFromMspz("111z234m456p789s11p");

    expect(bakazeDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(bakazeDefinition.getHansu(hand, baseContext)).toBe(1);
    expect(jikazeDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });

  it("自風の刻子で自風が成立し、場風は不成立", () => {
    // 東場・南家で 222z（南）
    const hand = createMentsuStructureFromMspz("222z234m456p789s11p");

    expect(jikazeDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(jikazeDefinition.getHansu(hand, baseContext)).toBe(1);
    expect(bakazeDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });

  it("連風牌（場風＝自風）の刻子は場風・自風の両方が成立する", () => {
    // 東場・東家で 111z（東）
    const context = { ...baseContext, jikaze: HaiKind.Ton };
    const hand = createMentsuStructureFromMspz("111z234m456p789s11p");

    expect(bakazeDefinition.getHansu(hand, context)).toBe(1);
    expect(jikazeDefinition.getHansu(hand, context)).toBe(1);
  });

  it("場風でも自風でもない風牌の刻子は不成立（客風牌）", () => {
    // 東場・南家で 333z（西）
    const hand = createMentsuStructureFromMspz("333z234m456p789s11p");

    expect(bakazeDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(jikazeDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });

  it("場風・自風が変われば同じ牌姿でも成立する役が変わる", () => {
    // 南場・西家で 333z（西）
    const context = {
      ...baseContext,
      bakaze: HaiKind.Nan,
      jikaze: HaiKind.Sha,
    };
    const hand = createMentsuStructureFromMspz("333z234m456p789s11p");

    expect(bakazeDefinition.isSatisfied(hand, context)).toBe(false);
    expect(jikazeDefinition.isSatisfied(hand, context)).toBe(true);
  });

  it("鳴いても1翻のまま", () => {
    // 東場・南家で [111z] ポン
    const hand = createMentsuStructureFromMspz("234m456p789s11p[111z]");
    const context = { ...baseContext, isMenzen: false };

    expect(bakazeDefinition.getHansu(hand, context)).toBe(1);
  });

  it("槓子でも成立する", () => {
    // 東場・南家で (1111z) 暗槓
    const hand = createMentsuStructureFromMspz("234m456p789s11p(1111z)");

    expect(bakazeDefinition.isSatisfied(hand, baseContext)).toBe(true);
  });

  it("対子（雀頭）では不成立", () => {
    // 東場・南家で 11z が雀頭
    const hand = createMentsuStructureFromMspz("11z234m456p789s111p");

    expect(bakazeDefinition.isSatisfied(hand, baseContext)).toBe(false);
  });
});
