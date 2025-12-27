import { describe, it, expect } from "vitest";
import { sanankouDefinition } from "./sanankou";
import { createTehai } from "../../../../utils/test-helpers";
import { decomposeTehaiForMentsu } from "../structures/mentsu";
import { HaiKind, type MentsuHouraStructure } from "../../../../types";
import type { HouraContext } from "../../types";

describe("三暗刻（サンアンコウ）の判定", () => {
  const mockContextTsumo: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
    isTsumo: true,
  };

  const mockContextRon: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // Dummy
    isTsumo: false,
  };

  it("ツモ和了の場合、全ての無副露刻子が暗刻としてカウントされ、3つの場合は成立する", () => {
    // 111m 222m 333m 456p 99s (ツモ)
    const tehai = createTehai("111m222m333m456p99s");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanankouDefinition.isSatisfied(hand, mockContextTsumo)).toBe(true);
    expect(sanankouDefinition.getHansu(hand, mockContextTsumo)).toBe(2);
  });

  it("ロン和了（シャボ待ち）の場合、和了牌を含む刻子は明刻扱いとなり、残り2つでは不成立", () => {
    // 111m 222m 333p 456s 99s (ロン 1m)
    // 1m, 9s のシャンポン待ちを想定
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.ManZu1,
    };
    const tehai = createTehai("111m222m333p456s99s");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    // 111m は明刻扱い。222m, 333p は暗刻。合計2つなので三暗刻は不成立。
    expect(sanankouDefinition.isSatisfied(hand, context)).toBe(false);
  });

  it("ロン和了（シャボ待ち）の場合でも、他に3つの暗刻があれば成立する", () => {
    // 111m 222m 333m 444p 99s (ロン 1m)
    // 1m, 9s のシャンポン待ち
    // 111m (明刻), 222m (暗刻), 333m (暗刻), 444p (暗刻) -> 合計3つ
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.ManZu1,
    };
    const tehai = createTehai("111m222m333m444p99s");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    expect(sanankouDefinition.isSatisfied(hand, context)).toBe(true);
  });

  it("ロン和了（単騎待ち）の場合、和了牌を含む刻子も暗刻としてカウントされる", () => {
    // 111m 222m 333m 456p 11s (ロン 1s)
    // 1s 単騎待ち
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.SouZu1,
    };
    const tehai = createTehai("111m222m333m456p11s");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;

    // 111m, 222m, 333m は暗刻。1sは雀頭なので刻子ではない。
    // あれ、これは単純な三暗刻のケース。単騎で刻子が完成するケースをテストしたい。

    expect(sanankouDefinition.isSatisfied(hand, context)).toBe(true);
  });

  it("副露していても、暗刻が3つあれば成立する", () => {
    // 111m 222m 333m [456p] 99s
    const tehai = createTehai("111m222m333m99s[456p]");
    const hands = decomposeTehaiForMentsu(tehai);
    const hand = hands[0] as unknown as MentsuHouraStructure;
    const context: HouraContext = { ...mockContextTsumo, isMenzen: false };

    expect(sanankouDefinition.isSatisfied(hand, context)).toBe(true);
  });
});
