import { describe, it, expect } from "vitest";
import { sankantsuDefinition } from "./sankantsu";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructuresForMentsuTe } from "../structures/mentsu-te";
import { HaiKind } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("三槓子（サンカンツ）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
  };

  it("槓子が3つある場合、成立すること", () => {
    // 1111m(暗槓), 2222p(暗槓), 3333s(暗槓), 123m, 99p
    // テストヘルパーの仕様上、[]で囲むと副露（明槓）扱いになるが、
    // ここでは単純にMentsuのtypeがKantsuであることを確認できれば良い。
    // createTehaiで暗槓を表現するには `(1111m)` のような記法が必要かもしれないが、
    // 現状の createTehai は `[1111m]` で明槓を作る。
    // 三槓子は副露していても成立するので、明槓でテストする。

    // [1111m], [2222p], [3333s], 123m, 99p
    const tehai = createTehai("123m99p[1111m][2222p][3333s]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sankantsuDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(sankantsuDefinition.getHansu(hand, mockContext)).toBe(2);
  });

  it("槓子が2つしかない場合は不成立", () => {
    // [1111m], [2222p], 333s, 123m, 99p
    const tehai = createTehai("123m99p333s[1111m][2222p]");
    const hands = getHouraStructuresForMentsuTe(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sankantsuDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
