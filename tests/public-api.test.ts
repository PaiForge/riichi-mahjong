import { describe, expect, it } from "vitest";
import type { Result } from "neverthrow";
import * as PublicApi from "../src/index";
import type { HaiKindId, Tehai13 } from "../src/index";
import { unwrapOrThrow } from "../src/utils/test-helpers";

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
      ) => Result<number, PublicApi.TehaiError>;

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

      // 役牌は三元牌に加えて場風・自風を含む
      "Bakaze" satisfies PublicApi.YakuName;
      "Jikaze" satisfies PublicApi.YakuName;

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
      ) => Result<PublicApi.ScoreResult, PublicApi.NoYakuError>;

      expect(true).toBe(true);
    });

    it("役が成立しない手では NoYakuError を Err として返すこと", () => {
      // 234m 234p 456s 678s + 55z(白) は役なし
      const tehai = unwrapOrThrow(PublicApi.parseMspz("234m234p456s678s55z"));
      const validated = unwrapOrThrow(PublicApi.validateTehai14(tehai));

      const result = PublicApi.calculateScoreForTehai(validated, {
        agariHai: 3, // 4m
        isTsumo: false,
        jikaze: PublicApi.HaiKind.Nan,
        bakaze: PublicApi.HaiKind.Ton,
        doraMarkers: [],
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PublicApi.NoYakuError);
      }
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

  describe("calculateScore", () => {
    it("関数としてエクスポートされていること", () => {
      expect(PublicApi.calculateScore).toBeDefined();
      expect(typeof PublicApi.calculateScore).toBe("function");
    });

    it("期待される型シグネチャを満たすこと", () => {
      PublicApi.calculateScore satisfies (
        han: number,
        fu: PublicApi.Fu,
        config: PublicApi.CalculateScoreConfig,
      ) => PublicApi.ScoreResult;

      expect(true).toBe(true);
    });

    it("翻数・符・ルール設定から点数を計算できること", () => {
      const score = PublicApi.calculateScore(4, 30, {
        isOya: false,
        isTsumo: false,
        ruleConfig: { kiriageMangan: true },
      });

      expect(PublicApi.getPaymentTotal(score.payment)).toBe(8000);
    });
  });

  describe("ルール差分設定の型 (RuleConfig)", () => {
    it("符・点数区分・役満のルールをまとめて指定できること", () => {
      const ruleConfig = {
        doubleWindJantouFu: 4,
        kiriageMangan: true,
        suuankouTanki: true,
      } satisfies PublicApi.RuleConfig;

      // 各層のルール設定型としても受け付けられること
      ruleConfig satisfies PublicApi.FuRuleConfig;
      ruleConfig satisfies PublicApi.ScoreLevelRuleConfig;
      ruleConfig satisfies PublicApi.YakumanRuleConfig;

      expect(ruleConfig.kiriageMangan).toBe(true);
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
      // パーサーは Branded ではない Tehai を Result で返す
      PublicApi.parseMspz satisfies (
        input: string,
      ) => Result<PublicApi.Tehai, PublicApi.MspzParseError>;

      expect(true).toBe(true);
    });

    it("parseExtendedMspz が期待される型シグネチャを満たすこと", () => {
      PublicApi.parseExtendedMspz satisfies (
        input: string,
      ) => Result<PublicApi.Tehai, PublicApi.MspzParseError>;

      expect(true).toBe(true);
    });
  });
});
