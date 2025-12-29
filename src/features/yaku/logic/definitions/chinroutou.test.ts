import { describe, it, expect } from "vitest";
import { chinroutouDefinition } from "./chinroutou";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("清老頭（チンロウトウ）の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("条件を満たす場合、役満（13飜）であること", () => {
    // 111m 999m 111p 999p 11s
    const tehai = createTehai("111m999m111p999p11s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      true,
    );
    expect(chinroutouDefinition.getHansu(hand, mockContextMenzen)).toBe(13);
  });

  it("副露していても成立すること", () => {
    // 111m 999m 111p 11s [999p] (Pon)
    const tehai = createTehai("111m999m111p11s[999p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinroutouDefinition.isSatisfied(hand, mockContextOpen)).toBe(true);
    expect(chinroutouDefinition.getHansu(hand, mockContextOpen)).toBe(13);
  });

  it("字牌が含まれる場合は不成立（混老頭）", () => {
    // 111m 999m 111p 999p 11z
    const tehai = createTehai("111m999m111p999p11z");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("中張牌が含まれる場合は不成立", () => {
    // 111m 999m 111p 234s 99s (234sがNG)
    const tehai = createTehai("111m999m111p234s99s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });

  it("順子が含まれる場合は不成立（純全帯幺九）", () => {
    // 現状のgetHouraStructuresForMentsuTeは、123mなどを順子として解釈する可能性があるが、
    // チンロウトウの条件（順子なし＝すべて刻子/対子）を満たすには、老頭牌のみであるため
    // そもそも順子（123, 789しかありえないが、2,8が入るので老頭牌のみではなくなる）は作れない。
    // そのため、「老頭牌のみであること」をチェックすれば自然と順子は排除される。
    // ここでは念のため、ジュンチャン形だが老頭牌ではないもの（順子）が含まれるケースとして
    // 上記の「中張牌が含まれる場合」でカバー済みとも言えるが、
    // 123m 999m... のような形は、牌構成として「2m, 3m」を含むため「老頭牌のみ」のチェックで落ちる。

    // 123m 999m 111p 999p 11s
    const tehai = createTehai("123m999m111p999p11s");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(chinroutouDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
