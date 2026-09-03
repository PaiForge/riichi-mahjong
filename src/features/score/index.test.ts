import { describe, it, expect } from "vitest";
import {
  calculateScoreFromHanAndFu,
  calculateBasePoints,
  getPaymentTotal,
  getYakumanMultiplier,
} from "./index";
import type { FuResult } from "./lib/fu/types";
import type { HouraContext } from "../yaku/types";
import { type Fu, HaiKind } from "../../types";

describe("calculateScoreFromHanAndFu", () => {
  const mockFuResult = (fu: Fu): FuResult => ({
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
      const score = calculateScoreFromHanAndFu(
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
      const score = calculateScoreFromHanAndFu(
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
      const score = calculateScoreFromHanAndFu(
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
      const score = calculateScoreFromHanAndFu(
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
      const score = calculateScoreFromHanAndFu(
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
      const score = calculateScoreFromHanAndFu(
        3,
        mockFuResult(70),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
    });

    it("親 6翻 (跳満) -> 18000点", () => {
      const score = calculateScoreFromHanAndFu(
        6,
        mockFuResult(30),
        0,
        mockContext(true, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(18000);
    });

    it("子 13翻 (数え役満) -> 32000点", () => {
      const score = calculateScoreFromHanAndFu(
        13,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 26翻 (数え) -> 役満止まりで32000点", () => {
      // 役満役なしの26翻（リーチ+裏+ドラ大量等）はダブル役満にならない
      const score = calculateScoreFromHanAndFu(
        26,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(score.scoreLevel).toBe("Yakuman");
      expect(score.yakumanMultiplier).toBe(0);
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 役満単位1 -> 32000点", () => {
      const score = calculateScoreFromHanAndFu(
        13,
        mockFuResult(30),
        0,
        mockContext(false, false),
        1,
      );
      expect(score.scoreLevel).toBe("Yakuman");
      expect(score.yakumanMultiplier).toBe(1);
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 役満単位2 (ダブル役満) -> 64000点", () => {
      const score = calculateScoreFromHanAndFu(
        26,
        mockFuResult(30),
        0,
        mockContext(false, false),
        2,
      );
      expect(score.scoreLevel).toBe("DoubleYakuman");
      expect(score.yakumanMultiplier).toBe(2);
      expect(getPaymentTotal(score.payment)).toBe(64000);
    });

    it("子 役満単位3 (トリプル役満) -> 96000点", () => {
      // 例: 大四喜ダブル + 字一色を複合合算した場合
      const score = calculateScoreFromHanAndFu(
        39,
        mockFuResult(30),
        0,
        mockContext(false, false),
        3,
      );
      expect(score.scoreLevel).toBe("DoubleYakuman");
      expect(score.yakumanMultiplier).toBe(3);
      expect(getPaymentTotal(score.payment)).toBe(96000);
    });
  });
});

describe("getYakumanMultiplier", () => {
  it("役満役がなければ 0（数え役満相当の翻数でも 0）", () => {
    expect(getYakumanMultiplier([])).toBe(0);
    expect(
      getYakumanMultiplier([
        ["Chinitsu", 6],
        ["Ryanpeikou", 3],
      ]),
    ).toBe(0);
  });

  it("役満1つなら 1", () => {
    expect(getYakumanMultiplier([["Suuankou", 13]])).toBe(1);
  });

  it("ダブル役満の形（26翻の役）は単体で 2", () => {
    expect(getYakumanMultiplier([["Suuankou", 26]])).toBe(2);
  });

  it("複合の合算なし（既定）: 複数役満は最高位1つ分", () => {
    expect(
      getYakumanMultiplier([
        ["Daisangen", 13],
        ["Tsuuiisou", 13],
      ]),
    ).toBe(1);
    // 単体で成立しているダブル役満は合算なしでも減らない
    expect(
      getYakumanMultiplier([
        ["Suuankou", 26],
        ["Tsuuiisou", 13],
      ]),
    ).toBe(2);
  });

  it("複合の合算あり: 役満単位の合計", () => {
    expect(
      getYakumanMultiplier(
        [
          ["Daisangen", 13],
          ["Tsuuiisou", 13],
        ],
        { fukugouYakuman: true },
      ),
    ).toBe(2);
    // ダブル役満の形 + 役満 = トリプル
    expect(
      getYakumanMultiplier(
        [
          ["Suuankou", 26],
          ["Tsuuiisou", 13],
        ],
        { fukugouYakuman: true },
      ),
    ).toBe(3);
  });
});

describe("calculateBasePoints", () => {
  describe("30符", () => {
    it("30符 2翻 -> 480", () => {
      // 30 * 2^(2+2) = 30 * 16 = 480
      expect(calculateBasePoints(30, 2)).toBe(480);
    });

    it("30符 3翻 -> 960", () => {
      // 30 * 2^(2+3) = 30 * 32 = 960
      expect(calculateBasePoints(30, 3)).toBe(960);
    });
  });

  describe("40符", () => {
    it("40符 2翻 -> 640", () => {
      // 40 * 2^(2+2) = 40 * 16 = 640
      expect(calculateBasePoints(40, 2)).toBe(640);
    });

    it("40符 3翻 -> 1280", () => {
      // 40 * 2^(2+3) = 40 * 32 = 1280
      expect(calculateBasePoints(40, 3)).toBe(1280);
    });
  });
});
