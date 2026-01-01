import { describe, it, expect } from "vitest";
import { ryanpeikouDefinition } from "./ryanpeiko";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure, HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("二盃口（リャンペーコー）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    doraMarkers: [], // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1,
    doraMarkers: [], // Dummy
  };

  it("標準的な二盃口が成立する場合（独立した2組の一盃口）、3飜であること", () => {
    // 112233m 445566p 99s
    const tehai = createTehai("112233m445566p99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    // 意図した分解（順子4つ）を選択する必要があるが、
    // この構成なら自然と順子優先で分解される可能性が高い。
    // getHouraStructuresForMentsuTeは全ての可能性を返すので、その中にRyanpeikouを満たすものがあればよい。

    // 手動で構造を確認するか、あるいは全ての分解結果に対してチェックして、少なくとも1つがTrueになることを確認する。
    const hasRyanpeikou = hands.some((hand) =>
      ryanpeikouDefinition.isSatisfied(
        hand as unknown as MentsuHouraStructure,
        mockContextMenzen,
      ),
    );

    expect(hasRyanpeikou).toBe(true);

    // Hansu check (using one valid hand)
    const validHand = hands.find((hand) =>
      ryanpeikouDefinition.isSatisfied(
        hand as unknown as MentsuHouraStructure,
        mockContextMenzen,
      ),
    );
    expect(
      ryanpeikouDefinition.getHansu(
        validHand as unknown as MentsuHouraStructure,
        mockContextMenzen,
      ),
    ).toBe(3);
  });

  it("一色四順（同じ順子が4つ）の場合も成立すること", () => {
    // 111122223333m 99s
    const tehai = createTehai("111122223333m99s");
    const hands = getHouraStructuresForMentsuTe(tehai);

    const hasRyanpeikou = hands.some((hand) =>
      ryanpeikouDefinition.isSatisfied(
        hand as unknown as MentsuHouraStructure,
        mockContextMenzen,
      ),
    );

    expect(hasRyanpeikou).toBe(true);
  });

  it("鳴いている場合は不成立", () => {
    // 112233m 445566p 99s (Open)
    // 構造自体はRyanpeikouだが、Menzenでない
    const tehai = createTehai("112233m445566p99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const validHand = hands[0];

    if (!validHand) throw new Error("分解失敗");

    // factoryの実装上、isSatisfiedは構造チェックのみを行うためtrueを返す可能性がある。
    // 一盃口(iipeiko.test.ts)と同様に、getHansuが0になることを確認する。
    expect(
      ryanpeikouDefinition.getHansu(
        validHand as unknown as MentsuHouraStructure,
        mockContextOpen,
      ),
    ).toBe(0);
  });

  it("一盃口が1つだけでは不成立", () => {
    // 112233m 456p 789s 99s
    const tehai = createTehai("112233m456p789s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);

    const hasRyanpeikou = hands.some((hand) =>
      ryanpeikouDefinition.isSatisfied(
        hand as unknown as MentsuHouraStructure,
        mockContextMenzen,
      ),
    );

    expect(hasRyanpeikou).toBe(false);
  });

  it("同じ順子が3つでは不成立（一盃口のみ）", () => {
    // 111222333m 456p 99s
    // 123m x3, 456p x1
    const tehai = createTehai("111222333m456p99s");
    const hands = getHouraStructuresForMentsuTe(tehai);

    const hasRyanpeikou = hands.some((hand) =>
      ryanpeikouDefinition.isSatisfied(
        hand as unknown as MentsuHouraStructure,
        mockContextMenzen,
      ),
    );

    expect(hasRyanpeikou).toBe(false);
  });

  it("七対子の構造として解釈された場合は不成立", () => {
    // 112233m 445566p 99s
    // 二盃口の形だが、七対子として解釈された構造オブジェクトに対してはfalseを返す
    const hand: HouraStructure = {
      type: "Chiitoitsu",
      pairs: [
        { type: "Toitsu", hais: [HaiKind.ManZu1, HaiKind.ManZu1] },
        { type: "Toitsu", hais: [HaiKind.ManZu2, HaiKind.ManZu2] },
        { type: "Toitsu", hais: [HaiKind.ManZu3, HaiKind.ManZu3] },
        { type: "Toitsu", hais: [HaiKind.PinZu4, HaiKind.PinZu4] },
        { type: "Toitsu", hais: [HaiKind.PinZu5, HaiKind.PinZu5] },
        { type: "Toitsu", hais: [HaiKind.PinZu6, HaiKind.PinZu6] },
        { type: "Toitsu", hais: [HaiKind.SouZu9, HaiKind.SouZu9] },
      ],
    };

    expect(ryanpeikouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
