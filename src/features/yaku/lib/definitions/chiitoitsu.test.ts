import { describe, it, expect } from "vitest";
import { chiitoitsuDefinition } from "./chiitoitsu";
import { HouraStructure, HouraContext } from "../../types";
import {
  createChiitoitsuStructureFromMspz,
  createHouraContext,
} from "../../../../utils/test-helpers";

describe("七対子", () => {
  const mockContext: HouraContext = createHouraContext();

  it("手牌構造が七対子の場合、条件を満たすこと", () => {
    const hand: HouraStructure =
      createChiitoitsuStructureFromMspz("11223344556677m");

    expect(chiitoitsuDefinition.isSatisfied(hand, mockContext)).toBe(true);
    expect(chiitoitsuDefinition.getHansu(hand, mockContext)).toBe(2);
  });
});
