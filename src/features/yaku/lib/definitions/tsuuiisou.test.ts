import { describe, it, expect } from "vitest";
import { tsuuiisouDefinition } from "./tsuuiisou";
import {
  createChiitoitsuStructureFromMspz,
  createHouraContext,
  createMentsuStructureFromMspz,
} from "../../../../utils/test-helpers";
import { HaiKind } from "../../../../types";
import type { HouraStructure } from "../../types";
import type { HouraContext } from "../../types";

describe("字一色（ツーイーソー）の判定", () => {
  const mockContext: HouraContext = createHouraContext({
    agariHai: HaiKind.Ton,
  });

  it("全ての牌が字牌の場合（面子手）、成立すること", () => {
    // 111z(東), 222z(南), 333z(西), 444z(北), 55z(白)
    const hand = createMentsuStructureFromMspz("111z222z333z444z55z");

    expect(tsuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(tsuuiisouDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("副露していても成立すること", () => {
    // 111z(東), 222z(南), 555z(白), 66z(發), [777z](中ポン)
    const hand = createMentsuStructureFromMspz("111z222z555z66z[777z]");
    const context: HouraContext = { ...mockContext, isMenzen: false };

    expect(tsuuiisouDefinition.isSatisfied(hand, context)).toBe(true);
    expect(tsuuiisouDefinition.getHansu(hand, context)).toBe(13);
  });

  it("七対子形（大七星）でも成立すること", () => {
    // 11z, 22z, 33z, 44z, 55z, 66z, 77z
    // 七対子構造を手動作成
    const hand: HouraStructure =
      createChiitoitsuStructureFromMspz("11223344556677z");

    expect(tsuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(tsuuiisouDefinition.getHansu(hand, mockContext)).toBe(13);
  });

  it("数牌（1・9牌）が含まれる場合（混老頭）は不成立", () => {
    // 111m, 111z, 222z, 333z, 44z (1mが含まれる)
    const hand = createMentsuStructureFromMspz("111m111z222z333z44z");

    expect(tsuuiisouDefinition.isSatisfied(hand, mockContext)).toBe(false);
  });
});
