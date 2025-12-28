import { describe, it, expect } from "vitest";
import { suuankouDefinition } from "./suuankou";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind, type MentsuHouraStructure } from "../../../../types";
import type { HouraContext } from "../../types";

describe("四暗刻（スーアンコウ）の判定", () => {
  const mockContextTsumo: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
    isTsumo: true,
  };

  const mockContextRon: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
    isTsumo: false,
  };

  it("ツモ和了の場合、4つの暗刻があれば成立し、13飜（役満）であること", () => {
    // 111m 222m 333m 444m 99s (ツモ)
    const tehai = createTehai("111m222m333m444m99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(suuankouDefinition.isSatisfied(hand, mockContextTsumo)).toBe(true);
    expect(suuankouDefinition.getHansu(hand, mockContextTsumo)).toBe(13);
  });

  it("単騎待ちロン和了の場合、ダブル役満（26飜）であること", () => {
    // 111m 222m 333m 444m 9s (ロン 9s)
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.SouZu9,
    };
    const tehai = createTehai("111m222m333m444m99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(suuankouDefinition.getHansu(hand, context)).toBe(26);
  });

  it("単騎待ちツモ和了の場合も、ダブル役満（26飜）であること", () => {
    // 111m 222m 333m 444m 9s (ツモ 9s)
    const context: HouraContext = {
      ...mockContextTsumo,
      agariHai: HaiKind.SouZu9,
    };
    const tehai = createTehai("111m222m333m444m99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(true);
    // 一般的なルールでは単騎待ちツモもダブル役満扱いとすることが多いが、
    // 実装(suuankou.ts)では `hand.jantou.hais[0] === context.agariHai` で判定しているので、
    // ツモでも単騎待ちなら26になるはず。
    expect(suuankouDefinition.getHansu(hand, context)).toBe(26);
  });

  it("シャボ待ちロン和了の場合、和了牌の刻子が明刻扱いとなり不成立", () => {
    // 111m 222m 333m 444m 99s (ロン 1m) -> 111mは明刻
    // 残り3暗刻なので四暗刻ではない（対々和・三暗刻）
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.ManZu1,
    };
    const tehai = createTehai("111m222m333m444m99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(false);
    expect(suuankouDefinition.getHansu(hand, context)).toBe(0);
  });
});
