import { describe, expect, it } from "vitest";
import { haiIdsToCounts34, haiIdsToMspzString } from "./mspz";
import { HaiKind } from "../index";

describe("mspz utils", () => {
  describe("haiIdsToCounts34", () => {
    it("門前手牌（13枚）が正しくカウントされること", () => {
      // 111m 234p 567s 11z 222z (Total 14 - need to reduce to 13 for testing generic case, but let's stick to 13)
      // Wait, the standard hand size is 13 for tehai in calculation unless agari...
      // the previous test had 14 tiles (3+3+3+2+3 = 14).
      // But the new requirement enforces 13.
      // Let's adjust the test case to be 13 tiles.
      // 111m 234p 567s 11z 2z (13 tiles)
      const hais = [
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.PinZu2,
        HaiKind.PinZu3,
        HaiKind.PinZu4,
        HaiKind.SouZu5,
        HaiKind.SouZu6,
        HaiKind.SouZu7,
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Nan,
      ] as const;

      const counts = haiIdsToCounts34(hais);
      expect(counts[HaiKind.ManZu1]).toBe(3);
      expect(counts[HaiKind.PinZu2]).toBe(1);
      expect(counts[HaiKind.PinZu3]).toBe(1);
      expect(counts[HaiKind.PinZu4]).toBe(1);
      expect(counts[HaiKind.SouZu5]).toBe(1);
      expect(counts[HaiKind.SouZu6]).toBe(1);
      expect(counts[HaiKind.SouZu7]).toBe(1);
      expect(counts[HaiKind.Ton]).toBe(2);
      expect(counts[HaiKind.Nan]).toBe(2);
      expect(counts[HaiKind.Pei]).toBe(0);
    });

    it("混合手牌（門前+副露、13枚フラット）が正しくカウントされること", () => {
      // closed: 11m
      // exposed: 234p (Chi), 555s (Pon)
      // Total: 2 + 3 + 3 = 8 tiles... wait, a full hand has 13 tiles.
      // If we are passing *all* tiles including exposed, it should be 13 (or 14 for agari).
      // The constraint is strict 13.
      // So we need to provide a full 13-tile hand.
      // Let's make a case: 11m 234p 555s + 5 random tiles
      // 11m 234p 555s 111z 22z
      const hais = [
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.PinZu2,
        HaiKind.PinZu3,
        HaiKind.PinZu4,
        HaiKind.SouZu5,
        HaiKind.SouZu5,
        HaiKind.SouZu5,
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Nan,
      ];

      const counts = haiIdsToCounts34(hais);
      expect(counts[HaiKind.ManZu1]).toBe(2);
      expect(counts[HaiKind.PinZu2]).toBe(1);
      expect(counts[HaiKind.PinZu3]).toBe(1);
      expect(counts[HaiKind.PinZu4]).toBe(1);
      expect(counts[HaiKind.SouZu5]).toBe(3);
    });

    it("入力配列の長さが13でない場合、エラーをスローすること", () => {
      const tooFew = [HaiKind.ManZu1, HaiKind.ManZu1];
      expect(() => haiIdsToCounts34(tooFew)).toThrow(
        /Invalid number of tiles: expected 13, got 2/,
      );

      const tooMany = Array(14).fill(HaiKind.ManZu1);
      expect(() => haiIdsToCounts34(tooMany)).toThrow(
        /Invalid number of tiles: expected 13, got 14/,
      );
    });
  });

  describe("haiIdsToMspzString", () => {
    it("13枚の牌が正しくMSPZ形式の文字列に変換されること", () => {
      // 123m 456p 789s 1122z
      const hais = [
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.PinZu4,
        HaiKind.PinZu5,
        HaiKind.PinZu6,
        HaiKind.SouZu7,
        HaiKind.SouZu8,
        HaiKind.SouZu9,
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Nan,
      ] as const;

      expect(haiIdsToMspzString(hais)).toBe("123m456p789s1122z");
    });

    it("入力が順不同でも正しくソートされて変換されること", () => {
      // Need 13 tiles
      // 1m 5s 9p + others
      const hais = [
        HaiKind.SouZu5,
        HaiKind.ManZu1,
        HaiKind.PinZu9,
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.PinZu1,
        HaiKind.PinZu1,
        HaiKind.SouZu1,
        HaiKind.SouZu1,
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Nan,
      ] as const;
      // 111m 119p 115s 1122z
      expect(haiIdsToMspzString(hais)).toBe("111m119p115s1122z");
    });

    it("字牌が正しく番号変換（東=1...中=7）されること", () => {
      // 1234567z + 6 more tiles
      const hais = [
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Sha,
        HaiKind.Pei,
        HaiKind.Haku,
        HaiKind.Hatsu,
        HaiKind.Chun,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Sha,
        HaiKind.Pei,
        HaiKind.Haku,
        HaiKind.Hatsu,
      ] as const;
      // Ton(1)x2, Nan(2)x2, Sha(3)x2, Pei(4)x2, Haku(5)x2, Hatsu(6)x2, Chun(7)x1
      expect(haiIdsToMspzString(hais)).toBe("1122334455667z");
    });
  });
});
