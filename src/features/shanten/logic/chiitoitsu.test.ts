import { describe, it, expect } from "vitest";
import { calculateChiitoitsuShanten } from "./chiitoitsu";
import type { Tehai13, HaiId } from "../../../types";
import { HaiKind, MentsuType } from "../../../types";
import { createTehai13 } from "../../../utils/test-helpers";

describe("calculateChiitoitsuShanten", () => {
  it("通常の1シャンテンの手牌で正しく計算できること", () => {
    // 11 22 33 44 55 6 7 (5対子, 7種類)
    // shanten = 6 - 5 = 1
    const hais = [
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.ManZu7,
      HaiKind.ManZu8,
    ];
    expect(calculateChiitoitsuShanten(createTehai13(hais))).toBe(1);
  });

  it("聴牌（0シャンテン）で正しく計算できること", () => {
    // 11 22 33 44 55 66 7 (6対子)
    const hais = [
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.ManZu6,
      HaiKind.ManZu7,
    ];
    expect(calculateChiitoitsuShanten(createTehai13(hais))).toBe(0);
  });

  it("副露がある場合はInfinityを返すこと", () => {
    const tehai: Tehai13 = {
      closed: [],
      exposed: [
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1],
        },
      ],
    };
    expect(calculateChiitoitsuShanten(tehai)).toBe(Infinity);
  });

  it("同種牌4枚使いを1対子として扱うこと", () => {
    // 1111 22 33 ...
    // 1111 は 1対子 (Kind 1).
    const hais = [
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.ManZu7,
    ];
    // 対子: 1, 2, 3, 4. 計4対子.
    // 種類: 1,2,3,4,5,6,7. (7種類).
    // シャンテン = 6 - 4 = 2.
    expect(calculateChiitoitsuShanten(createTehai13(hais))).toBe(2);
  });

  it("7種類未満の場合にペナルティを加算すること", () => {
    // 11 22 33 44 55 66 6
    // 種類: 1,2,3,4,5,6. (6種類).
    // 対子: 6.
    // シャンテン = 6 - 6 + (7 - 6) = 1.
    const hais = [
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.ManZu6,
      HaiKind.ManZu6, // 3枚目の6
    ];
    expect(calculateChiitoitsuShanten(createTehai13(hais))).toBe(1);
  });

  it("Tehai<HaiId>（ID >= 34を含む）が正しく正規化されて計算できること", () => {
    // 筒子 (ID >= 36) を使用して、HaiIdモードが発動することを確認
    const hais = [
      36,
      37, // PinZu1 対子
      40,
      41, // PinZu2 対子
      44,
      45, // PinZu3 対子
      48,
      49, // PinZu4 対子
      52,
      53, // PinZu5 対子
      56,
      57, // PinZu6 対子
      60, // PinZu7 単騎
    ] as HaiId[];
    // 6対子, 7種類
    // シャンテン = 0 (聴牌)
    expect(calculateChiitoitsuShanten(createTehai13(hais))).toBe(0);
  });

  it("Tehai<HaiId>で同種牌4枚（HaiId 36-39など）が含まれる場合も1対子として正しく計算されること", () => {
    // HaiId 36, 37, 38, 39 -> PinZu1 (Kind 9) * 4
    // 他: 40,41(PinZu2), 44,45(PinZu3), 48,49(PinZu4), 52,53(PinZu5), 56(PinZu6)
    // 合計: 5対子
    // 種類: 9,10,11,12,13,14 (6種類)
    // シャンテン = 6 - 5 + (7 - 6) = 2
    const hais = [
      36,
      37,
      38,
      39, // PinZu1 * 4
      40,
      41, // PinZu2
      44,
      45, // PinZu3
      48,
      49, // PinZu4
      52,
      53, // PinZu5
      56, // PinZu6
    ] as HaiId[];
    expect(calculateChiitoitsuShanten(createTehai13(hais))).toBe(2);
  });
});
