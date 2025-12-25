import { describe, it, expect } from "vitest";
import { pinfuDefinition } from "./pinfu";
import { createShuntsu, createToitsu } from "../../../utils/test-helpers";
import { HaiKind } from "../../../types";
import type { HouraContext, HouraStructure } from "../types";
import { MahjongArgumentError } from "../../../errors";

function makeHand(
  mentsuStrs: [string, string, string, string],
  jantouStr: string,
): HouraStructure {
  return {
    fourMentsu: [
      createShuntsu(mentsuStrs[0]),
      createShuntsu(mentsuStrs[1]),
      createShuntsu(mentsuStrs[2]),
      createShuntsu(mentsuStrs[3]),
    ],
    jantou: createToitsu(jantouStr),
  };
}

describe("平和の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu4, // デフォルトのあがり牌
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
  };

  it("場風が指定されていない場合はエラーを投げること", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "99s");
    const context = { ...baseContext, bakaze: undefined };
    expect(() => pinfuDefinition.isSatisfied(hand, context)).toThrow(
      MahjongArgumentError,
    );
  });

  it("自風が指定されていない場合はエラーを投げること", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "99s");
    const context = { ...baseContext, jikaze: undefined };
    expect(() => pinfuDefinition.isSatisfied(hand, context)).toThrow(
      MahjongArgumentError,
    );
  });

  it("条件を満たす場合、正しく判定されること", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "99s");
    const context = {
      ...baseContext,
      agariHai: HaiKind.SouZu4,
    };

    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("門前でない場合は成立しないこと", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "99s");
    const context = {
      ...baseContext,
      isMenzen: false,
      agariHai: HaiKind.SouZu4,
    };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が三元牌の場合は成立しないこと", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "5z5z"); // 白
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が場風の場合は成立しないこと", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "1z1z"); // 東
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭が自風の場合は成立しないこと", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "2z2z"); // 南
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });

  it("雀頭がオタ風の場合は成立すること", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "3z3z"); // 西
    const context = { ...baseContext, agariHai: HaiKind.SouZu4 };
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(true);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(1);
  });

  it("待ちが両面ではない場合は成立しないこと", () => {
    const hand = makeHand(["123m", "456m", "789p", "234s"], "99s");
    const context = { ...baseContext, agariHai: HaiKind.SouZu3 }; // 3s
    expect(pinfuDefinition.isSatisfied(hand, context)).toBe(false);
    expect(pinfuDefinition.getHansu(hand, context)).toBe(0);
  });
});
