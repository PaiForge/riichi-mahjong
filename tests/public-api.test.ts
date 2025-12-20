import { describe, expect, it } from "vitest";
import * as PublicApi from "../src/index";
import type { HaiId, HaiKindId, Tehai13 } from "../src/index";

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
        tehai: Tehai13<HaiKindId | HaiId>,
        useChiitoitsu?: boolean,
        useKokushi?: boolean,
      ) => number;

      expect(true).toBe(true);
    });
  });
});
