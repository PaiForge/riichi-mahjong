import { describe, it, expect } from "vitest";
import { sanshokuDoujunDefinition } from "./sanshoku-doujun";
import { createShuntsu, createToitsu } from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext, HouraStructure } from "../../types";

function makeHand(
  mentsuStrs: [string, string, string, string],
  jantouStr: string,
): HouraStructure {
  return {
    type: "Mentsu",
    fourMentsu: [
      createShuntsu(mentsuStrs[0]),
      createShuntsu(mentsuStrs[1]),
      createShuntsu(mentsuStrs[2]),
      createShuntsu(mentsuStrs[3]),
    ],
    jantou: createToitsu(jantouStr),
  };
}

describe("三色同順の判定", () => {
  const mockContextMenzen: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  const mockContextOpen: HouraContext = {
    isMenzen: false,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("門前で三色同順が成立する場合、2飜であること", () => {
    // 123m 123p 123s + others
    const hand = makeHand(["123m", "123p", "123s", "789p"], "99p");
    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      true,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextMenzen)).toBe(2);
  });

  it("鳴きありで三色同順が成立する場合、1飜であること", () => {
    // 123m 123p 123s(chi)
    const hand = makeHand(["123m", "123p", "123s", "765s"], "99p");
    // makeHand creates standard Shuntsu, simplified for structure check
    // The implementation doesn't check which specific mentsu is exposed for isSatisfied locally,
    // but yaku definition handles open/closed scoring.

    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextOpen)).toBe(
      true,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextOpen)).toBe(1);
  });

  it("色が揃っていない場合は不成立（2色のみ）", () => {
    // 123m 123p 456s 789s
    const hand = makeHand(["123m", "123p", "456s", "789s"], "99p");
    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("数字が揃っていない場合は不成立", () => {
    // 123m 123p 234s
    const hand = makeHand(["123m", "123p", "234s", "789p"], "99p");
    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
    expect(sanshokuDoujunDefinition.getHansu(hand, mockContextMenzen)).toBe(0);
  });

  it("順子が3つ未満の場合は不成立（刻子が含まれる）", () => {
    // Requires 3 Shuntsu. If logic extracts Shuntsu properly, this should fail if count < 3 matches.
    // But logic is "find any 3 shuntsu combination".
    // Case: 123m 123p 111s 789p -> distinct suits? 1m, 1p, 7p (not 3 distinct suits)
    const hand: HouraStructure = {
      type: "Mentsu",
      jantou: createToitsu("99p"),
      fourMentsu: [
        createShuntsu("123m"),
        createShuntsu("123p"),
        {
          type: "Koutsu",
          hais: [HaiKind.SouZu1, HaiKind.SouZu1, HaiKind.SouZu1],
        },
        createShuntsu("789p"),
      ],
    };
    expect(sanshokuDoujunDefinition.isSatisfied(hand, mockContextMenzen)).toBe(
      false,
    );
  });
});
