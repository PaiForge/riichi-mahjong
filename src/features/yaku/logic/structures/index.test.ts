import { describe, it, expect } from "vitest";
import { getHouraStructures } from "./index";
import { createTehai } from "../../../../utils/test-helpers";
import { CompletedMentsu, MentsuType } from "../../../../types";
import type { HouraStructure } from "../../types";

describe("getHouraStructures (Unified)", () => {
  describe("和了形が一通りにしか解釈できない手牌", () => {
    it("標準的な平和形が1通りの構造としてのみ解釈されること", () => {
      // 123m 456p 789s 123s 99m
      const hand = createTehai("123m456p789s123s99m");
      const results = getHouraStructures(hand);

      expect(results.length).toBe(1);
      expect(results[0]?.type).toBe("Mentsu");
    });
  });

  describe("和了形が複数の構造で解釈できる手牌", () => {
    it("三連刻形（111222333）が複数の構造として解釈できること", () => {
      // 111m 222m 333m 456p 99s
      const hand = createTehai("111m222m333m456p99s");
      const results = getHouraStructures(hand);

      expect(results.length).toBeGreaterThan(1);

      // パターン1: 刻子x3 (Toitoi系)
      const hasToitoiShape = results.some((r: HouraStructure) => {
        if (r.type !== "Mentsu") return false;
        const koutsuCount = r.fourMentsu.filter(
          (m: CompletedMentsu) => m.type === MentsuType.Koutsu,
        ).length;
        return koutsuCount >= 3;
      });
      expect(hasToitoiShape).toBe(true);

      // パターン2: 順子x3 (Pinfu系, Ryanpeikou系)
      const hasPinfuShape = results.some((r: HouraStructure) => {
        if (r.type !== "Mentsu") return false;
        const shuntsuCount = r.fourMentsu.filter(
          (m: CompletedMentsu) => m.type === MentsuType.Shuntsu,
        ).length;
        // 456p も順子なので合計4つの順子になるはず
        return shuntsuCount === 4;
      });
      expect(hasPinfuShape).toBe(true);
    });

    it("二盃口形であり七対子形でもある手牌が両方の構造として解釈できること", () => {
      // 223344m 223344p 55s
      // 七対子: 22,33,44,22,33,44,55
      // 二盃口(面子手): 234,234,234,234,55
      const hand = createTehai("223344m223344p55s");
      const results = getHouraStructures(hand);

      expect(results.length).toBeGreaterThan(1);

      const hasChiitoitsu = results.some((r) => r.type === "Chiitoitsu");
      const hasMentsu = results.some((r) => r.type === "Mentsu");

      expect(hasChiitoitsu).toBe(true);
      expect(hasMentsu).toBe(true);
    });

    it("一盃口形が頭の位置によって2通りの構造（頭待ちは単騎、順子は両面など）に解釈できること", () => {
      // 22334455m 123p 123s
      // 解釈1: 22m(雀頭) + 345m + 345m (一盃口) + 123p + 123s
      // 解釈2: 55m(雀頭) + 234m + 234m (一盃口) + 123p + 123s
      const hand = createTehai("22334455m123p123s");
      const results = getHouraStructures(hand);

      expect(results.length).toBeGreaterThanOrEqual(2);

      const hasHead2m = results.some((r) => {
        if (r.type !== "Mentsu") return false;
        // 2m = ManZu2 = 1
        return r.jantou.hais[0] === 1;
      });

      const hasHead5m = results.some((r) => {
        if (r.type !== "Mentsu") return false;
        // 5m = ManZu5 = 4
        return r.jantou.hais[0] === 4;
      });

      expect(hasHead2m).toBe(true);
      expect(hasHead5m).toBe(true);
    });
  });
});
