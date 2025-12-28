import { describe, it, expect } from "vitest";
import { toitoiDefinition } from "./toitoi";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import {
  HaiKind,
  type HouraStructure,
  type MentsuHouraStructure,
} from "../../../../types";
import type { HouraContext } from "../../types";

describe("対々和（トイトイ）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("全ての面子が刻子の場合、成立すること", () => {
    // 111m, 222p, 333s, 444z, 55z
    const tehai = createTehai("111m222p333s444z55z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(toitoiDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(toitoiDefinition.getHansu(hand, mockContext)).toBe(2);
  });

  it("暗槓・明槓が含まれていても成立すること", () => {
    // [1111m](暗槓), [2222p](明槓), 333s, 444z, 55z
    // 副露が含まれるため、門前ではないコンテキスト
    const tehai = createTehai("333s444z55z[1111m][2222p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(toitoiDefinition.isSatisfied(hand, context)).toBe(true);
    expect(toitoiDefinition.getHansu(hand, context)).toBe(2);
  });

  it("順子が含まれる場合は不成立", () => {
    // 123m, 222p, 333s, 444z, 55z
    const tehai = createTehai("123m222p333s444z55z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(toitoiDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("七対子は不成立（面子手としての構成要件を満たさないため）", () => {
    // 七対子は getHouraStructuresForMentsuTe では解析されない場合があるが、
    // ここでは便宜上、MentsuHouraStructureを持たないか、持っても順子や刻子の構成にならず
    // CheckToitoiで弾かれることを確認したい。
    // 実装上、hand.type !== "Mentsu" で弾かれるはず。

    // 手動で構造を作成してテスト
    const hand = { type: "Chiitoitsu" } as unknown as HouraStructure;
    expect(toitoiDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
