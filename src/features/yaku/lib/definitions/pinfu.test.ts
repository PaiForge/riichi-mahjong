import { describe, it, expect } from "vitest";
import { pinfuDefinition } from "./pinfu";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";
import { MahjongArgumentError } from "../../../../errors";

describe("平和の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu4,
    doraMarkers: [], // デフォルトのあがり牌
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
  };

  it("場風が指定されていない場合はエラーを投げること", () => {
    // 123m 456m 789p 234s 99s
    const tehai = createTehai("123m456m789p234s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    const context = { ...baseContext, bakaze: undefined };
    expect(() => pinfuDefinition.isSatisfied(hand, context)).toThrow(
      MahjongArgumentError,
    );
  });

  it("自風が指定されていない場合はエラーを投げること", () => {
    const tehai = createTehai("123m456m789p234s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = { ...baseContext, jikaze: undefined };
    expect(() => pinfuDefinition.isSatisfied(hand, context)).toThrow(
      MahjongArgumentError,
    );
  });

  it("条件を満たす場合、正しく判定されること", () => {
    const tehai = createTehai("123m456m789p234s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = {
      ...baseContext,
      agariHai: HaiKind.SouZu4,
      doraMarkers: [],
    };

    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("門前でない場合は成立しないこと", () => {
    const tehai = createTehai("123m456m789p234s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
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
    const tehai = createTehai("123m456m789p234s55z"); // 白
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が場風の場合は成立しないこと", () => {
    const tehai = createTehai("123m456m789p234s11z"); // 東
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が自風の場合は成立しないこと", () => {
    const tehai = createTehai("123m456m789p234s22z"); // 南
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭がオタ風の場合は成立すること", () => {
    const tehai = createTehai("123m456m789p234s33z"); // 西
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("待ちが両面ではない場合は成立しないこと", () => {
    const tehai = createTehai("123m456m789p234s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context = { ...baseContext, agariHai: HaiKind.SouZu3 }; // 3s
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });
});
