import { describe, expect, it } from "vitest";
import { ShoushaiError, TahaiError } from "../errors";
import type { Kantsu, Shuntsu } from "../types";
import { HaiKind, MentsuType } from "../types";
import {
  isTehai13,
  isTehai14,
  validateTehai13,
  validateTehai14,
} from "./tehai";

describe("Tehai Validation (手牌の検証)", () => {
  // Helper to create a dummy Tehai with N closed tiles
  const createTehai = (closedCount: number, furos: any[] = []) => ({
    closed: Array(closedCount).fill(HaiKind.ManZu1),
    exposed: furos,
  });

  const dummyMentsu: Shuntsu = {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
  };

  const dummyKantsu: Kantsu = {
    type: MentsuType.Kantsu,
    hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1],
  };

  describe("Tehai13 (13枚の手牌)", () => {
    it("13枚ちょうどの手牌で検証が通過すること", () => {
      const tehai = createTehai(13);
      expect(() => validateTehai13(tehai)).not.toThrow();
      expect(isTehai13(tehai)).toBe(true);
    });

    it("純手牌10枚 + 面子1つで検証が通過すること", () => {
      const tehai = createTehai(10, [dummyMentsu]);
      expect(() => validateTehai13(tehai)).not.toThrow();
      expect(isTehai13(tehai)).toBe(true);
    });

    it("純手牌10枚 + 槓子1つで検証が通過すること", () => {
      const tehai = createTehai(10, [dummyKantsu]);
      expect(() => validateTehai13(tehai)).not.toThrow();
      expect(isTehai13(tehai)).toBe(true);
    });

    it("槓子を含まない13枚未満の場合に ShoushaiError がスローされること", () => {
      const tehai = createTehai(12);
      expect(() => validateTehai13(tehai)).toThrow(ShoushaiError);
      expect(isTehai13(tehai)).toBe(false);
    });

    it("槓子を含まない13枚を超える場合に TahaiError がスローされること", () => {
      const tehai = createTehai(14);
      expect(() => validateTehai13(tehai)).toThrow(TahaiError);
      expect(isTehai13(tehai)).toBe(false);
    });
  });

  describe("Tehai14 (14枚の手牌)", () => {
    it("14枚ちょうどの手牌で検証が通過すること", () => {
      const tehai = createTehai(14);
      expect(() => validateTehai14(tehai)).not.toThrow();
      expect(isTehai14(tehai)).toBe(true);
    });

    it("純手牌11枚 + 槓子1つで検証が通過すること", () => {
      const tehai = createTehai(11, [dummyKantsu]);
      expect(() => validateTehai14(tehai)).not.toThrow();
      expect(isTehai14(tehai)).toBe(true);
    });

    it("槓子を含まない14枚未満の場合に ShoushaiError がスローされること", () => {
      const tehai = createTehai(13);
      expect(() => validateTehai14(tehai)).toThrow(ShoushaiError);
      expect(isTehai14(tehai)).toBe(false);
    });

    it("槓子を含まない14枚を超える場合に TahaiError がスローされること", () => {
      const tehai = createTehai(15);
      expect(() => validateTehai14(tehai)).toThrow(TahaiError);
      expect(isTehai14(tehai)).toBe(false);
    });
  });
});
