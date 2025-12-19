import { describe, it, expect } from "vitest";
import { calculateMentsuShanten } from "./mentsu";
import { HaiKind, MentsuType, type CompletedMentsu } from "../../../types";
import { createTehai13, createMentsu } from "../../../utils/test-helpers";

describe("calculateMentsuShanten", () => {
  it("聴牌を判定できること", () => {
    // 例: 111 222 333 444 5 (スッタン) -> 0
    const tenpaiTehai = createTehai13([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.PinZu7,
      HaiKind.PinZu8,
      HaiKind.PinZu9,
      HaiKind.SouZu1,
      HaiKind.SouZu2,
      HaiKind.SouZu3,
      HaiKind.SouZu9,
    ]);
    expect(calculateMentsuShanten(tenpaiTehai)).toBe(0);
  });

  it("1シャンテンを判定できること", () => {
    // 123m 567m 55s(Head) 12p(Taatsu) 88p(Taatsu) 9s(Iso)
    // M=2, H=1, T=2 -> Shanten 1
    const tehai = createTehai13([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.ManZu7,
      HaiKind.SouZu5,
      HaiKind.SouZu5,
      HaiKind.PinZu1,
      HaiKind.PinZu2,
      HaiKind.PinZu8,
      HaiKind.PinZu8,
      HaiKind.SouZu9,
    ]);
    expect(calculateMentsuShanten(tehai)).toBe(1);
  });

  it("2シャンテンを判定できること", () => {
    const tehai = createTehai13([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.PinZu1,
      HaiKind.PinZu2,
      HaiKind.SouZu5,
      HaiKind.SouZu6,
      HaiKind.SouZu9,
      HaiKind.SouZu9,
      HaiKind.Ton,
      HaiKind.Ton,
    ]);
    expect(calculateMentsuShanten(tehai)).toBe(2);
  });

  it("副露がある場合の計算ができること", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu6,
        HaiKind.SouZu8,
        HaiKind.SouZu8,
        HaiKind.PinZu1,
        HaiKind.PinZu9,
      ],
      exposed: [
        createMentsu(MentsuType.Koutsu, [
          HaiKind.Hatsu,
          HaiKind.Hatsu,
          HaiKind.Hatsu,
        ]) as CompletedMentsu,
      ],
    };
    expect(calculateMentsuShanten(tehai)).toBe(1);
  });

  it("七対子聴牌だが面子手としてはシャンテン数が悪い場合", () => {
    // 11 44 77m 22 55 88p 9s (13枚)
    // 順子が一切できない形
    const tehai = createTehai13([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu4,
      HaiKind.ManZu4,
      HaiKind.ManZu7,
      HaiKind.ManZu7,
      HaiKind.PinZu2,
      HaiKind.PinZu2,
      HaiKind.PinZu5,
      HaiKind.PinZu5,
      HaiKind.PinZu8,
      HaiKind.PinZu8,
      HaiKind.SouZu9,
    ]);
    // M=0
    // H=1 (どれか)
    // T=5 (残り5対子) -> 有効3 (M=0, H=1 -> 残り4ブロック中3つまで)
    // ではなく、H=1の場合、残りブロック枠=4なので T=4まで有効。
    // Shanten = 8 - 0 - 4 - 1 = 3
    expect(calculateMentsuShanten(tehai)).toBe(3);
  });

  it("国士無双聴牌だが面子手としてはシャンテン数が悪い場合", () => {
    // 19m 19p 19s 1234567z (13枚)
    // 国士無双13面待ち聴牌
    const tehai = createTehai13([
      HaiKind.ManZu1,
      HaiKind.ManZu9,
      HaiKind.PinZu1,
      HaiKind.PinZu9,
      HaiKind.SouZu1,
      HaiKind.SouZu9,
      HaiKind.Ton,
      HaiKind.Nan,
      HaiKind.Sha,
      HaiKind.Pei,
      HaiKind.Haku,
      HaiKind.Hatsu,
      HaiKind.Chun,
    ]);
    // M=0
    // H=0 (対子なし)
    // T=0 (塔子なし)
    // Shanten = 8 - 0 - 0 - 0 = 8
    expect(calculateMentsuShanten(tehai)).toBe(8);
  });

  it("塔子オーバーのケース (2446形など)", () => {
    const tehai = createTehai13([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3, // M1
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu6, // M2
      HaiKind.SouZu1,
      HaiKind.SouZu1, // Head
      HaiKind.PinZu2,
      HaiKind.PinZu4,
      HaiKind.PinZu4,
      HaiKind.PinZu6, // 2446 shape
      HaiKind.Ton, // Orphan
    ]);
    // 2446 -> 24(T), 46(T) = 2 Taatsu.
    // M=2, H=1.
    // Remaining blocks = 2.
    // T valid = 2.
    // Shanten = 8 - 4 - 2 - 1 = 1.
    expect(calculateMentsuShanten(tehai)).toBe(1);
  });
});
