import { describe, it, expect } from "vitest";
import { sankantsuDefinition } from "./sankantsu";
import {
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import type { HouraContext } from "../../types";

describe("三槓子（サンカンツ）の判定", () => {
  const mockContext: HouraContext = createHouraContext();

  it("槓子が3つある場合、成立すること", () => {
    // 1111m(暗槓), 2222p(暗槓), 3333s(暗槓), 123m, 99p
    // テストヘルパーの仕様上、[]で囲むと副露（明槓）扱いになるが、
    // ここでは単純にMentsuのtypeがKantsuであることを確認できれば良い。
    // createTehaiで暗槓を表現するには `(1111m)` のような記法が必要かもしれないが、
    // 現状の createTehai は `[1111m]` で明槓を作る。
    // 三槓子は副露していても成立するので、明槓でテストする。

    // [1111m], [2222p], [3333s], 789m, 99p
    const hand = createMentsuStructureFromMspz("789m99p[1111m][2222p][3333s]");

    expect(sankantsuDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(sankantsuDefinition.getHansu(hand, mockContext)).toBe(2);
  });

  it("槓子が2つしかない場合は不成立", () => {
    // [1111m], [2222p], 333s, 789m, 99p
    const hand = createMentsuStructureFromMspz("789m99p333s[1111m][2222p]");

    expect(sankantsuDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
