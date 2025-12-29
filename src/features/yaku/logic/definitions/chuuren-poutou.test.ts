import { describe, it, expect } from "vitest";
import { chuurenPoutouDefinition } from "./chuuren-poutou";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("九蓮宝燈（チューレンポートー）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("1112345678999 + 1枚の形（純正九蓮宝燈含む）で成立すること", () => {
    // 1111m 2345678 999m (1m待ち, 1mで和了)
    const tehai = createTehai("1111m2345678m999m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    // 九蓮宝燈は分解結果にかかわらず、元の手牌構成で判定するため
    // 任意の分解結果を渡してチェックする
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chuurenPoutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      true,
    );
    expect(chuurenPoutouDefinition.getHansu(hand, mockContextMenzen)).toBe(13);
  });

  it("1112345678999 + 5枚の形でも成立すること", () => {
    // 111m 234 55 678 999m (5m待ち, 5mで和了)
    const tehai = createTehai("111m234m55m678m999m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chuurenPoutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      true,
    );
    expect(chuurenPoutouDefinition.getHansu(hand, mockContextMenzen)).toBe(13);
  });

  it("門前でない場合（鳴きあり）は不成立", () => {
    // 形は九蓮宝燈だが、暗槓を除く副露がある場合は不成立（門前役）
    // ただし九蓮宝燈の定義上、鳴いてこの形を作ることは通常不可能（1-9全て揃えるため）
    // テストとしてフラグチェックを行う
    const tehai = createTehai("1111m2345678m999m");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chuurenPoutouDefinition.isSatisfied(hand, mockContextOpen)).toBe(
      false,
    );
    expect(chuurenPoutouDefinition.getHansu(hand, mockContextOpen)).toBe(0);
  });

  it("清一色でない場合は不成立", () => {
    // 111m 234m 567m 888p 99p (筒子が混ざる、しかし面子手として成立する形)
    const tehai = createTehai("111m234m567m888p99p");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chuurenPoutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("1が3枚未満の場合は不成立", () => {
    // 11m 234m 456m 789m 999m (1が2枚)
    const tehai = createTehai("11m234m456m789m999m"); // 14枚
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chuurenPoutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
