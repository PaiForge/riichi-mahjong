import { describe, it, expect } from "vitest";
import { calculateBasicScore, getPaymentTotal } from "./index";
import type { FuResult } from "./lib/fu/types";
import type { HouraContext } from "../yaku/types";
import { HaiKind } from "../../types";

describe("calculateBasicScore", () => {
  const mockFuResult = (fu: number): FuResult => ({
    total: fu,
    details: { base: 20, mentsu: 0, jantou: 0, machi: 0, agari: 0 },
  });

  const mockContext = (
    isOya: boolean,
    isTsumo: boolean,
  ): HouraContext & { isOya: boolean } => ({
    isOya,
    isTsumo,
    isMenzen: true,
    agariHai: HaiKind.ManZu1, // dummy
    doraMarkers: [],
  });

  describe("基本ケース (Normal)", () => {
    it("子 30符 1翻 ロン -> 1000点", () => {
      // Base: 30 * 2^(2+1) = 30 * 8 = 240
      // Ron: 240 * 4 = 960 -> 1000
      const score = calculateBasicScore(
        1,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(score.payment.type).toBe("ron");
      expect(getPaymentTotal(score.payment)).toBe(1000);
    });

    it("子 30符 4翻 ロン -> 7700点", () => {
      // Base: 30 * 2^6 = 30 * 64 = 1920
      // Ron: 1920 * 4 = 7680 -> 7700
      const score = calculateBasicScore(
        4,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(score.payment.type).toBe("ron");
      expect(getPaymentTotal(score.payment)).toBe(7700);
    });

    it("親 30符 4翻 ロン -> 11600点", () => {
      // Base: 1920
      // Ron: 1920 * 6 = 11520 -> 11600
      const score = calculateBasicScore(
        4,
        mockFuResult(30),
        0,
        mockContext(true, false),
      );
      expect(score.payment.type).toBe("ron");
      expect(getPaymentTotal(score.payment)).toBe(11600);
    });

    it("子 20符 2翻 ツモ (平和ツモ) -> 400/700 (1500点)", () => {
      // Base: 20 * 2^4 = 320
      // Oya pays: 320 * 2 = 640 -> 700
      // Ko pays: 320 * 1 = 320 -> 400
      // Total from 3 players.
      // Oya pay: 700.
      // Ko pay: 400.
      // Total: 700 + 400*2 = 1500.
      const score = calculateBasicScore(
        2,
        mockFuResult(20),
        0,
        mockContext(false, true),
      );
      expect(score.payment.type).toBe("koTsumo");
      if (score.payment.type === "koTsumo") {
        expect(score.payment.amount).toEqual([400, 700]);
      }
      expect(getPaymentTotal(score.payment)).toBe(1500);
    });
  });

  describe("満貫以上 (Limits)", () => {
    it("子 5翻 (満貫) -> 8000点", () => {
      // 30符5翻 -> Mangan
      const score = calculateBasicScore(
        5,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
    });

    it("子 70符 3翻 (満貫切り上げ) -> 8000点", () => {
      // Base: 70 * 2^5 = 70 * 32 = 2240
      // 2240 >= 2000 -> Mangan
      const score = calculateBasicScore(
        3,
        mockFuResult(70),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
    });

    it("親 6翻 (跳満) -> 18000点", () => {
      const score = calculateBasicScore(
        6,
        mockFuResult(30),
        0,
        mockContext(true, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(18000);
    });

    it("子 13翻 (数え役満) -> 32000点", () => {
      const score = calculateBasicScore(
        13,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 26翻 (ダブル役満) -> 64000点", () => {
      const score = calculateBasicScore(
        26,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(64000);
    });
  });
});
