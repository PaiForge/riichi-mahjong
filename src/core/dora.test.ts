import { describe, it, expect } from "vitest";
import { getDoraNext, countDora } from "./dora";
import { HaiKind } from "../types";
import { createTehai } from "../utils/test-helpers";

describe("dora", () => {
  describe("getDoraNext", () => {
    it("数牌の次は+1", () => {
      expect(getDoraNext(HaiKind.ManZu1)).toBe(HaiKind.ManZu2);
      expect(getDoraNext(HaiKind.PinZu5)).toBe(HaiKind.PinZu6);
      expect(getDoraNext(HaiKind.SouZu8)).toBe(HaiKind.SouZu9);
    });

    it("数牌の9の次は1", () => {
      expect(getDoraNext(HaiKind.ManZu9)).toBe(HaiKind.ManZu1);
      expect(getDoraNext(HaiKind.PinZu9)).toBe(HaiKind.PinZu1);
      expect(getDoraNext(HaiKind.SouZu9)).toBe(HaiKind.SouZu1);
    });

    it("風牌のループ (東南西北)", () => {
      expect(getDoraNext(HaiKind.Ton)).toBe(HaiKind.Nan);
      expect(getDoraNext(HaiKind.Nan)).toBe(HaiKind.Sha);
      expect(getDoraNext(HaiKind.Sha)).toBe(HaiKind.Pei);
      expect(getDoraNext(HaiKind.Pei)).toBe(HaiKind.Ton);
    });

    it("三元牌のループ (白發中)", () => {
      expect(getDoraNext(HaiKind.Haku)).toBe(HaiKind.Hatsu);
      expect(getDoraNext(HaiKind.Hatsu)).toBe(HaiKind.Chun);
      expect(getDoraNext(HaiKind.Chun)).toBe(HaiKind.Haku);
    });
  });

  describe("countDora", () => {
    it("手牌に含まれるドラの数を返す", () => {
      // Tehai: 123m 456p 789s 11z 222z
      const tehai = createTehai("123m456p789s11z222z");
      // Indicator: 9m (Dora: 1m), 3p (Dora: 4p), Pei (Dora: Ton=1z)
      const indicators = [HaiKind.ManZu9, HaiKind.PinZu3, HaiKind.Pei];
      // Dora in hand:
      // 1m: 1
      // 4p: 1
      // Ton (1z): 2
      // Total: 4
      expect(countDora(tehai, indicators)).toBe(4);
    });

    it("副露した牌もカウントする", () => {
      // Tehai: 123m [456p] 789s ...
      const tehai = createTehai("123m789s11z[456p]");
      // Indicator: 3p (Dora: 4p)
      const indicators = [HaiKind.PinZu3];
      // 4p in [456p] is 1.
      expect(countDora(tehai, indicators)).toBe(1);
    });

    it("槓子内のドラも4枚すべてカウントする", () => {
      // Tehai: [1111m] (Kan)
      const tehai = createTehai("234s99s[1111m]");
      // Indicator: 9m (Dora: 1m)
      const indicators = [HaiKind.ManZu9];
      // 1m x4 = 4
      expect(countDora(tehai, indicators)).toBe(4);
    });

    it("複数のドラ表示牌に対応する", () => {
      // Tehai: 111m
      const tehai = createTehai("111m234s567p11z22z");
      // Indicators: 9m (Dora 1m), 9m (Dora 1m) -> Double Dora
      const indicators = [HaiKind.ManZu9, HaiKind.ManZu9];
      // 1m x 3 tiles. Each is doublg dora. Total 3 * 2 = 6?
      // Logic: for each tile, check if it matches ANY doraHai.
      // My logic:
      /*
            for (const hai of tehai.closed) {
              for (const dora of doraHais) {
                if (hai === dora) count++;
              }
            }
            */
      // If doraHais = [1m, 1m].
      // For tile 1m: matches dora[0] (+1), dora[1] (+1). Total +2.
      // Valid.
      expect(countDora(tehai, indicators)).toBe(6);
    });
  });
});
