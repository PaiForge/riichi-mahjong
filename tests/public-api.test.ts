import { describe, expect, it } from "vitest";
import * as PublicApi from "../src/index";
import type { HaiKindId, Tehai13 } from "../src/index";

describe("公開APIのエクスポート", () => {
  describe("calculateShanten", () => {
    // ランタイムチェック
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.calculateShanten).toBeDefined();
      expect(typeof PublicApi.calculateShanten).toBe("function");
    });

    // 'satisfies' を使用したコンパイル時の型チェック
    it("期待される型シグネチャを満たすこと", () => {
      // コンパイルエラーにならなければOK
      PublicApi.calculateShanten satisfies (
        tehai: Tehai13,
        useChiitoitsu?: boolean,
        useKokushi?: boolean,
      ) => number;

      expect(true).toBe(true);
    });
  });

  describe("getUkeire", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.getUkeire).toBeDefined();
      expect(typeof PublicApi.getUkeire).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.getUkeire satisfies (tehai: Tehai13) => HaiKindId[];

      expect(true).toBe(true);
    });
  });

  describe("detectYaku", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.detectYaku).toBeDefined();
      expect(typeof PublicApi.detectYaku).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.detectYaku satisfies (
        tehai: PublicApi.Tehai14,
        config: PublicApi.DetectYakuConfig,
      ) => PublicApi.YakuResult;

      expect(true).toBe(true);
    });
  });

  describe("calculateScoreForTehai", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.calculateScoreForTehai).toBeDefined();
      expect(typeof PublicApi.calculateScoreForTehai).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.calculateScoreForTehai satisfies (
        tehai: PublicApi.Tehai14,
        config: PublicApi.ScoreCalculationConfig,
      ) => PublicApi.ScoreResult;

      expect(true).toBe(true);
    });
  });

  describe("getYakumanMultiplier", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.getYakumanMultiplier).toBeDefined();
      expect(typeof PublicApi.getYakumanMultiplier).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.getYakumanMultiplier satisfies (
        yakuResult: PublicApi.YakuResult,
        ruleConfig?: PublicApi.YakumanRuleConfig,
      ) => number;

      expect(true).toBe(true);
    });
  });

  describe("Parser (parseMspz / parseExtendedMspz)", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.parseMspz).toBeDefined();
      expect(typeof PublicApi.parseMspz).toBe("function");

      expect(PublicApi.parseExtendedMspz).toBeDefined();
      expect(typeof PublicApi.parseExtendedMspz).toBe("function");
    });

    it("parseMspz が期待される型シグネチャを満たすこと", () => {
      PublicApi.parseMspz satisfies (input: string) => PublicApi.Tehai; // パーサーは Branded ではない Tehai を返す

      expect(true).toBe(true);
    });

    it("parseExtendedMspz が期待される型シグネチャを満たすこと", () => {
      PublicApi.parseExtendedMspz satisfies (input: string) => PublicApi.Tehai;

      expect(true).toBe(true);
    });
  });
});
