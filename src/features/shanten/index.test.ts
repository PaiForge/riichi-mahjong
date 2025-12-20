import { describe, it, expect } from "vitest";
import { calculateShanten } from "./index";
import { HaiKind } from "../../types";
import { createTehai13 } from "../../utils/test-helpers";

describe("calculateShanten (Integration)", () => {
  describe("デフォルトの挙動（全てのフラグが有効）", () => {
    it("七対子の手が最善の場合、七対子のシャンテン数を返すこと", () => {
      // 11 22 33 44 55 66 7 (七対子 聴牌: 0, 面子手: 良好(一盃口?) 0?)
      // 11, 44, 77, 11, 44, 77, 9 (七対子 聴牌: 0. 面子手: 3シャンテン ※単体テストで確認済)
      const tehai = createTehai13([
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.ManZu4,
        HaiKind.ManZu4,
        HaiKind.ManZu7,
        HaiKind.ManZu7,
        HaiKind.PinZu2,
        HaiKind.PinZu2,
        HaiKind.PinZu5,
        HaiKind.PinZu5,
        HaiKind.PinZu8,
        HaiKind.PinZu8,
        HaiKind.SouZu9,
      ]);
      expect(calculateShanten(tehai)).toBe(0);
    });

    it("国士無双の手が最善の場合、国士無双のシャンテン数を返すこと", () => {
      // 19m 19p 19s 1234567z (国士無双 聴牌: 0)
      const tehai = createTehai13([
        HaiKind.ManZu1,
        HaiKind.ManZu9,
        HaiKind.PinZu1,
        HaiKind.PinZu9,
        HaiKind.SouZu1,
        HaiKind.SouZu9,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Sha,
        HaiKind.Pei,
        HaiKind.Haku,
        HaiKind.Hatsu,
        HaiKind.Chun,
      ]);
      expect(calculateShanten(tehai)).toBe(0);
    });

    it("面子手の手が最善の場合、面子手のシャンテン数を返すこと", () => {
      // 123m 456m 789p 11s 23s (面子手 聴牌: 0)
      const tehai = createTehai13([
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu6,
        HaiKind.PinZu7,
        HaiKind.PinZu8,
        HaiKind.PinZu9,
        HaiKind.SouZu1,
        HaiKind.SouZu1,
        HaiKind.SouZu2,
        HaiKind.SouZu3,
      ]);
      expect(calculateShanten(tehai)).toBe(0);
    });
  });

  describe("フラグ制御", () => {
    it("useChiitoitsu=false の場合、七対子の形でも面子手として評価されること", () => {
      // 11 22 33 44 55 66 7 (七対子 聴牌: 0)
      const tehai = createTehai13([
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.ManZu4,
        HaiKind.ManZu4,
        HaiKind.ManZu7,
        HaiKind.ManZu7,
        HaiKind.PinZu2,
        HaiKind.PinZu2,
        HaiKind.PinZu5,
        HaiKind.PinZu5,
        HaiKind.PinZu8,
        HaiKind.PinZu8,
        HaiKind.SouZu9,
      ]);

      // Chiitoitsu無効なら 3 (面子手としての結果)
      expect(calculateShanten(tehai, false, true)).toBe(3);
    });

    it("useKokushi=false の場合、国士無双の形でも面子手として評価されること", () => {
      // 19m 19p 19s 1234567z (国士無双 聴牌: 0)
      const tehai = createTehai13([
        HaiKind.ManZu1,
        HaiKind.ManZu9,
        HaiKind.PinZu1,
        HaiKind.PinZu9,
        HaiKind.SouZu1,
        HaiKind.SouZu9,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Sha,
        HaiKind.Pei,
        HaiKind.Haku,
        HaiKind.Hatsu,
        HaiKind.Chun,
      ]);

      // Kokushi無効なら、七対子のシャンテン数(6)と面子手のシャンテン数(8)の最小値 -> 6
      expect(calculateShanten(tehai, true, false)).toBe(6);
      // 七対子も無効なら 8 (面子手としての結果)
      expect(calculateShanten(tehai, false, false)).toBe(8);
    });
  });

  describe("エラーハンドリング", () => {
    it("バリデーションエラーが伝播すること", () => {
      // 14 tiles
      const badTehai = {
        closed: Array(14).fill(HaiKind.ManZu1),
        exposed: [],
      };
      // Note: calculateShanten calls validateTehai13
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => calculateShanten(badTehai as any)).toThrow();
    });
  });
});
