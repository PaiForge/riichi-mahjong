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
      // NOTE: Tehai14 は Tehai<T> (default HaiKindId) のエイリアス
      // 型パラメータは実装に合わせて HaiKindId | HaiId ではなくデフォルト(HaiKindId)を利用する
      PublicApi.detectYaku satisfies (
        tehai: PublicApi.Tehai14,
        agariHai: HaiKindId,
        bakaze?: HaiKindId,
        jikaze?: HaiKindId,
      ) => PublicApi.YakuResult;

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
      PublicApi.parseMspz satisfies (
        input: string,
      ) => PublicApi.Tehai13 | PublicApi.Tehai14; // Returns Tehai generic

      expect(true).toBe(true);
    });

    it("parseExtendedMspz が期待される型シグネチャを満たすこと", () => {
      PublicApi.parseExtendedMspz satisfies (
        input: string,
      ) => PublicApi.Tehai13 | PublicApi.Tehai14;

      expect(true).toBe(true);
    });
  });
});
