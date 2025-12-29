import { describe, it, expect } from "vitest";
import { ryuuiisouDefinition } from "./ryuuiisou";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("緑一色（リューイーソー）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.SouZu2,
    doraMarkers: [], // Dummy
  };

  it("全ての牌が緑色牌（23468s, 發）の場合、成立すること", () => {
    // 234s, 234s, 666s, 888s, 66z(發)
    const tehai = createTehai("234s234s666s888s66z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ryuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(ryuuiisouDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("發を含まない緑一色（純緑一色形）でも成立すること", () => {
    // 222s, 333s, 444s, 666s, 88s
    const tehai = createTehai("222s333s444s666s88s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ryuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(true);
    // ライブラリ仕様として、発なしでも通常の緑一色と同じ役満扱いを確認
    expect(ryuuiisouDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("副露していても成立すること", () => {
    // 234s, 666s, 88s, 666z(發), [888s](8sポン) - ※8sが足りないが構成としては例示
    // 正しい例: 234s, 666s, 66z(發雀頭), [888s], [234s]
    const tehai = createTehai("234s666s66z[888s][234s]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(ryuuiisouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(ryuuiisouDefinition.getHansu(hand, context)).toBe(13);
  });

  it("緑色以外の牌が1枚でも含まれる場合は不成立", () => {
    // 234s, 234s, 666s, 888s, 11z(東・緑ではない)
    const tehai = createTehai("234s234s666s888s11z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ryuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("索子でも緑色でない牌（1,5,7,9）が含まれる場合は不成立", () => {
    // 234s, 666s, 888s, 66z(發), 555s(5sは緑ではない)
    const tehai = createTehai("234s666s888s66z555s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(ryuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
