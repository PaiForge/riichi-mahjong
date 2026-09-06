import { describe, it, expect } from "vitest";
import { daisangenDefinition } from "./daisangen";
import { createMentsuStructureFromMspz } from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../types";

describe("大三元（ダイサンゲン）の判定", () => {
  const mockContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [], // Dummy
  };

  it("白・發・中の刻子が全て揃っている場合、成立すること", () => {
    // 555z (白), 666z (發), 777z (中), 11m, 23p
    // ※ 14枚の構成として 11m, 23p だと和了形ではない（23pは塔子）。
    // テストヘルパーは13枚+和了牌ではなく、和了形（14枚または副露込み）を作るものと仮定。
    // getHouraStructuresForMentsuTe は和了形（4面子1雀頭）を期待する。
    // 例: 555z 666z 777z 11m 123p
    const hand = createMentsuStructureFromMspz("11m123p555z666z777z");

    expect(daisangenDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(daisangenDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("副露していても成立すること", () => {
    // 555z (白), 666z (發), 123m, 11p, [777z] (中ポン)
    const hand = createMentsuStructureFromMspz("123m11p555z666z[777z]");
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(daisangenDefinition.isSatisfied(hand, context)).toBe(true);
    expect(daisangenDefinition.getHansu(hand, context)).toBe(13);
  });

  it("小三元（三元牌の刻子2つ＋雀頭）の場合は不成立", () => {
    // 555z (白), 666z (發), 77z (中・雀頭), 123m, 456p
    const hand = createMentsuStructureFromMspz("123m456p555z666z77z");

    expect(daisangenDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });

  it("三元牌の刻子が2つしかない場合（雀頭も三元牌でない）は不成立", () => {
    // 555z (白), 666z (發), 11m (雀頭), 123p, 456s
    const hand = createMentsuStructureFromMspz("11m123p456s555z666z");

    expect(daisangenDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
