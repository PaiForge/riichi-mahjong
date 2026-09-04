import { describe, it, expect } from "vitest";
import { detectYaku } from "./index";
import { createTehai, getHaiKindId } from "../../utils/test-helpers";
import { HaiKind } from "../../types";

describe("手牌からの役判定 (detectYaku) - 統合テスト", () => {
  describe("面子手 (Mentsu)", () => {
    it("複合役（断么・平和）が判定できること", () => {
      // 234m 234p 234s 678s 88p (8p雀頭)
      // 平和: すべて順子、雀頭役牌なし、両面待ち
      // 断么: 2-8のみ
      // 8p単騎に見えるが、234m 234p 234s 678s + [88p] という構成。
      // あがり牌が両面待ちでなければ平和にならない。
      // 例: 234m 234p 234s 67s [8s]ツモ -> 678s完成 (両面)
      const hand = createTehai("234m234p234s678s88p");
      const agari = getHaiKindId("8s");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      // Tanyao (1) + Pinfu (1)
      expect(result).toContainEqual(["Tanyao", 1]);
      expect(result).toContainEqual(["Pinfu", 1]);
    });

    it("二盃口が判定でき、七対子とは複合しないこと", () => {
      // 二盃口形: 223344m 223344p 55z
      // これは七対子の形でもあるが、二盃口と七対子は同じ牌姿でも牌の数え方が違うため、基本的に複合しない
      // より高い翻数の二盃口として判定されるべき
      const hand = createTehai("223344m223344p55z");
      const agari = getHaiKindId("2m");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toContainEqual(["Ryanpeikou", 3]);
      // 七対子は含まれないはず（面子手として解釈されたため）
      expect(result).not.toContainEqual(["Chiitoitsu", 2]);
    });
  });

  describe("風牌の役牌 (Bakaze / Jikaze)", () => {
    it("場風の刻子で場風が成立すること", () => {
      // 東場・南家: 111z 234m 456p 789s 11p
      const hand = createTehai("111z234m456p789s11p");

      const result = detectYaku(hand, {
        agariHai: getHaiKindId("4m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toContainEqual(["Bakaze", 1]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Jikaze"]));
    });

    it("連風牌の刻子は場風・自風の両方が成立し合計2翻になること", () => {
      // 東場・東家: 111z 234m 456p 789s 11p
      const hand = createTehai("111z234m456p789s11p");

      const result = detectYaku(hand, {
        agariHai: getHaiKindId("4m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Ton,
      });

      expect(result).toContainEqual(["Bakaze", 1]);
      expect(result).toContainEqual(["Jikaze", 1]);
    });

    it("客風牌の刻子では役にならないこと", () => {
      // 東場・南家で 333z（西）のみ。他に役が無いので役なし
      const hand = createTehai("333z234m456p789s11p");

      const result = detectYaku(hand, {
        agariHai: getHaiKindId("4m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toEqual([]);
    });

    it("鳴いた場風の刻子も1翻で成立すること", () => {
      // 東場・南家: [111z] ポン + 234m 456p 789s 11p
      const hand = createTehai("234m456p789s11p[111z]");

      const result = detectYaku(hand, {
        agariHai: getHaiKindId("4m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toEqual([["Bakaze", 1]]);
    });
  });

  describe("七対子 (Chiitoitsu)", () => {
    it("複合役（七対子・混一色）が判定できること", () => {
      const hand = createTehai("11m33m55m77m99m11z22z");
      const agari = getHaiKindId("1m");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toContainEqual(["Chiitoitsu", 2]);
      expect(result).toContainEqual(["Honitsu", 3]); // 混一色は食い下がりあるが、七対子は門前役なので3翻のはず
    });
  });

  describe("国士無双 (KokushiMusou)", () => {
    it("国士無双が判定できること", () => {
      const hand = createTehai("19m19p19s1234567z1m");
      const agari = getHaiKindId("1m");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toContainEqual(["KokushiMusou", 13]);
    });
  });
});
