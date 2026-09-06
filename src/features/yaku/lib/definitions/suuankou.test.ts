import { describe, it, expect } from "vitest";
import { suuankouDefinition } from "./suuankou";
import { createMentsuStructureFromMspz } from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("四暗刻（スーアンコウ）の判定", () => {
  const mockContextTsumo: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [], // Dummy
    isTsumo: true,
  };

  const mockContextRon: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [], // Dummy
    isTsumo: false,
  };

  it("ツモ和了の場合、4つの暗刻があれば成立し、13翻（役満）であること", () => {
    // 111m 222m 333m 444m 99s (ツモ)
    const hand = createMentsuStructureFromMspz("111m222m333m444m99s");

    expect(suuankouDefinition.isSatisfied(hand, mockContextTsumo)).toBe(true);
    expect(suuankouDefinition.getHansu(hand, mockContextTsumo)).toBe(13);
  });

  it("単騎待ちでも、既定（ルール設定なし）では13翻（役満）であること", () => {
    // 111m 222m 333m 444m 9s (ロン 9s)
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.SouZu9,
      doraMarkers: [],
    };
    const hand = createMentsuStructureFromMspz("111m222m333m444m99s");

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(suuankouDefinition.getHansu(hand, context)).toBe(13);
  });

  it("単騎待ちロン和了の場合、単騎ダブルルール有効ならダブル役満（26翻）であること", () => {
    // 111m 222m 333m 444m 9s (ロン 9s)
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.SouZu9,
      doraMarkers: [],
      yakumanRuleConfig: { suuankouTanki: true },
    };
    const hand = createMentsuStructureFromMspz("111m222m333m444m99s");

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(suuankouDefinition.getHansu(hand, context)).toBe(26);
  });

  it("単騎待ちツモ和了の場合も、単騎ダブルルール有効ならダブル役満（26翻）であること", () => {
    // 111m 222m 333m 444m 9s (ツモ 9s)
    const context: HouraContext = {
      ...mockContextTsumo,
      agariHai: HaiKind.SouZu9,
      doraMarkers: [],
      yakumanRuleConfig: { suuankouTanki: true },
    };
    const hand = createMentsuStructureFromMspz("111m222m333m444m99s");

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(true);
    // 一般的なルールでは単騎待ちツモもダブル役満扱いとすることが多いが、
    // 実装(suuankou.ts)では `hand.jantou.hais[0] === context.agariHai` で判定しているので、
    // ツモでも単騎待ちなら26になるはず。
    expect(suuankouDefinition.getHansu(hand, context)).toBe(26);
  });

  it("シャボ待ちツモ和了の場合、単騎ダブルルール有効でも13翻（役満）であること", () => {
    // 111m 222m 333m 444m 99s (ツモ 1m) -> 単騎ではない
    const context: HouraContext = {
      ...mockContextTsumo,
      agariHai: HaiKind.ManZu1,
      doraMarkers: [],
      yakumanRuleConfig: { suuankouTanki: true },
    };
    const hand = createMentsuStructureFromMspz("111m222m333m444m99s");

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(suuankouDefinition.getHansu(hand, context)).toBe(13);
  });

  it("シャボ待ちロン和了の場合、和了牌の刻子が明刻扱いとなり不成立", () => {
    // 111m 222m 333m 444m 99s (ロン 1m) -> 111mは明刻
    // 残り3暗刻なので四暗刻ではない（対々和・三暗刻）
    const context: HouraContext = {
      ...mockContextRon,
      agariHai: HaiKind.ManZu1,
      doraMarkers: [],
    };
    const hand = createMentsuStructureFromMspz("111m222m333m444m99s");

    expect(suuankouDefinition.isSatisfied(hand, context)).toBe(false);
    expect(suuankouDefinition.getHansu(hand, context)).toBe(0);
  });
});
