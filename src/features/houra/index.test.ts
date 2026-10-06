import { describe, it, expect } from "vitest";
import { rankHouraInterpretations, selectHouraInterpretation } from "./index";
import { detectYaku } from "../yaku";
import { calculateScoreForTehai } from "../score";
import { NoYakuError } from "../../errors";
import {
  createHouraContext,
  createScoreCalculationConfig,
  createTehai,
  getHaiKindId,
  unwrapOrThrow,
} from "../../utils/test-helpers";
import type { HouraContext } from "../yaku/types";
import type { ScoreCalculationConfig } from "../score/types";

/** テスト用の和了コンテキスト（門前・場風東・自風南・ドラなし）を作る */
function createContext(agari: string, isTsumo: boolean): HouraContext {
  return createHouraContext({ agariHai: getHaiKindId(agari), isTsumo });
}

/** テスト用の点数計算コンフィグ（子・場風東・自風南・ドラなし）を作る */
function createConfig(agari: string, isTsumo: boolean): ScoreCalculationConfig {
  return createScoreCalculationConfig({
    agariHai: getHaiKindId(agari),
    isTsumo,
  });
}

describe("和了解釈の選択 (selectHouraInterpretation)", () => {
  describe("高点法", () => {
    it("翻数が同じなら点数の高い解釈を採用すること", () => {
      // 677778888999m + 55p ロン(6m)
      //   [678m 789m 789m 77m? ...] 平和 + 一盃口 = 2翻30符 (2000点)
      //   [678m 777m 888m 999m + 55p] 三暗刻 = 2翻50符 (3200点)
      // 翻数は同じ2翻だが、点数の高い三暗刻の解釈を採る。
      const tehai = createTehai("677778888999m55p");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("6m", false),
      );

      expect(interpretation?.yakuResult).toEqual([["Sanankou", 2]]);
      expect(interpretation?.fuResult.total).toBe(50);
    });

    it("点数が同じなら翻数の高い解釈を採用すること", () => {
      // 33445566778899m ロン(3m)
      //   [345m 345m 678m 678m + 99m] 平和 + 二盃口 + 清一色 = 10翻30符
      //   [456m 456m 789m 789m + 33m] 二盃口 + 清一色 = 9翻40符
      // いずれも倍満（16000点）で同点だが、翻数の高い前者を採る。
      const tehai = createTehai("33445566778899m");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("3m", false),
      );

      expect(interpretation?.yakuResult).toEqual([
        ["Pinfu", 1],
        ["Ryanpeikou", 3],
        ["Chinitsu", 6],
      ]);
      expect(interpretation?.machiType).toBe("Ryanmen");
    });
  });

  describe("和了牌の置き場所（同じ面子分解の中での高点法）", () => {
    // 同じ面子分解でも、和了牌を雀頭・順子・刻子のどこに入れたと見るかで
    // 待ち・明暗・役が変わる。最も高い置き場所を採る。
    it("雀頭と順子の両方に入る和了牌は、平和が付く両面を採ること", () => {
      // 345m 345m 55m 123s 456s ロン(5m)
      //   5m を 55m に入れる: 単騎 -> 一盃口のみ 1翻40符 (1300点)
      //   5m を 345m に入れる: 両面 -> 平和 + 一盃口 2翻30符 (2000点)
      const tehai = createTehai("33445555m123456s");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("5m", false),
      );

      expect(interpretation?.yakuResult).toEqual([
        ["Pinfu", 1],
        ["Iipeikou", 1],
      ]);
      expect(interpretation?.fuResult.total).toBe(30);
      expect(interpretation?.machiType).toBe("Ryanmen");

      const score = unwrapOrThrow(
        calculateScoreForTehai(tehai, createConfig("5m", false)),
      );
      expect(score.payment).toEqual({ type: "ron", amount: 2000 });
    });

    it("和了牌が順子にしか入らなければ従来どおり両面の平和のみであること", () => {
      // 234m 345m 55m 123s 456s ロン(2m)
      const tehai = createTehai("23344555m123456s");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("2m", false),
      );

      expect(interpretation?.yakuResult).toEqual([["Pinfu", 1]]);
      expect(interpretation?.fuResult.total).toBe(30);
      expect(interpretation?.machiType).toBe("Ryanmen");
    });

    it("雀頭と順子の両方に入るが、単騎のほうが符が高ければ単騎を採ること", () => {
      // 345m 55m 999p 666s 111z ロン(5m): 刻子があり平和は付かない
      //   単騎: 20 + 10 + 8 + 4 + 8 + 2 = 52 -> 60符
      //   両面: 20 + 10 + 8 + 4 + 8 = 50符
      // 場風 1翻 + 三暗刻 2翻はどちらでも同じ
      const tehai = createTehai("34555m999p666s111z");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("5m", false),
      );

      expect(interpretation?.yakuResult).toEqual([
        ["Sanankou", 2],
        ["Bakaze", 1],
      ]);
      expect(interpretation?.fuResult.total).toBe(60);
      expect(interpretation?.machiType).toBe("Tanki");
    });

    it("刻子と順子の両方に入る和了牌は、ロンでも刻子を暗刻に残す置き場所を採ること", () => {
      // 222m 234m 555z 678s 33s ロン(2m)
      //   2m を 222m に入れる: 双碰 -> 222m は明刻 2符 -> 40符
      //   2m を 234m に入れる: 両面 -> 222m は暗刻 4符 -> 20 + 10 + 4 + 8 = 42 -> 50符
      const tehai = createTehai("222234m555z678s33s");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("2m", false),
      );

      expect(interpretation?.yakuResult).toEqual([["Haku", 1]]);
      expect(interpretation?.fuResult.total).toBe(50);
      expect(interpretation?.fuResult.details.mentsu).toBe(12);
      expect(interpretation?.machiType).toBe("Ryanmen");
    });

    it("刻子と順子の両方に入る和了牌で、暗刻を残せば三暗刻になる置き場所を採ること", () => {
      // 111m 123m 999p 555s 66z ロン(1m)
      //   1m を 111m に入れる: 明刻で暗刻 2 つ -> 役なし
      //   1m を 123m に入れる: 両面で暗刻 3 つ -> 三暗刻 2翻60符
      const tehai = createTehai("111123m999p555s66z");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("1m", false),
      );

      expect(interpretation?.yakuResult).toEqual([["Sanankou", 2]]);
      expect(interpretation?.fuResult.total).toBe(60);
      expect(interpretation?.machiType).toBe("Ryanmen");
    });

    it("2つの順子に入る和了牌は、平和が付く両面を採ること", () => {
      // 123m 345m 456p 678s 99p ロン(3m)
      //   3m を 123m に入れる: 辺張 -> 役なし
      //   3m を 345m に入れる: 両面 -> 平和 1翻30符
      const tehai = createTehai("123345m456p678s99p");
      const interpretation = selectHouraInterpretation(
        tehai,
        createContext("3m", false),
      );

      expect(interpretation?.yakuResult).toEqual([["Pinfu", 1]]);
      expect(interpretation?.fuResult.total).toBe(30);
      expect(interpretation?.machiType).toBe("Ryanmen");
    });
  });

  it("役が成立する解釈が無ければ undefined を返すこと", () => {
    // 234m 234p 456s 678s + 55z(白) は役なし（白は雀頭のため役牌にならず、
    // 役牌の雀頭により平和も不成立）
    const tehai = createTehai("234m234p456s678s55z");
    const interpretation = selectHouraInterpretation(
      tehai,
      createContext("4m", false),
    );

    expect(interpretation).toBeUndefined();
  });
});

describe("和了解釈の順位付け (rankHouraInterpretations)", () => {
  it("役のある解釈だけを高点法の降順で返し、先頭が採用される解釈であること", () => {
    // 677778888999m 55p ロン(6m)
    //   [678m 777m 888m 999m 55p] 三暗刻 2翻50符 (基本点 800)
    //   [678m 789m 789m 77m? ...] 平和 + 一盃口 2翻30符 (基本点 480)
    const tehai = createTehai("677778888999m55p");
    const context = createContext("6m", false);
    const ranked = rankHouraInterpretations(tehai, context);

    expect(ranked.length).toBeGreaterThanOrEqual(2);
    expect(ranked[0]).toEqual(selectHouraInterpretation(tehai, context));
    expect(ranked[0]?.yakuResult).toEqual([["Sanankou", 2]]);
    expect(ranked.every((i) => i.yakuHansu > 0)).toBe(true);

    // 降順になっている（基本点 → 翻数 → 符）
    const keys = ranked.map((i) => [i.fuResult.total, i.yakuHansu + i.dora]);
    expect(keys[0]).toEqual([50, 2]);
  });

  it("成立する和了が無ければ空配列を返すこと", () => {
    const tehai = createTehai("234m234p456s678s55z");
    expect(rankHouraInterpretations(tehai, createContext("4m", false))).toEqual(
      [],
    );
  });
});

describe("役判定と点数計算の解釈の一致", () => {
  // [手牌, 和了牌, ツモかどうか] の多義な和了形
  const CASES: [string, string, boolean][] = [
    ["33445566778899m", "3m", false],
    ["33445566778899m", "3m", true],
    ["22334455677889m", "2m", true],
    ["677778888999m55p", "6m", false],
    ["334455667788m99m", "9m", false],
    ["234567234567m11p", "7m", false],
    ["111222333444m55p", "4m", true],
    ["112233445566m77p", "3m", false],
    ["123456789m11122z", "1z", false],
    ["11223344556677m", "7m", false],
  ];

  it.each(CASES)(
    "%s の和了牌 %s (ツモ: %s) で detectYaku と calculateScoreForTehai が同じ解釈を採ること",
    (mspz, agari, isTsumo) => {
      const tehai = createTehai(mspz);
      const config = createConfig(agari, isTsumo);

      const yakuResult = detectYaku(tehai, config);
      const scoreResult = unwrapOrThrow(calculateScoreForTehai(tehai, config));

      expect(scoreResult.detail.yakuResult).toEqual(yakuResult);
    },
  );

  it("役が成立しない手では detectYaku が空配列を返し、点数計算は NoYakuError を返すこと", () => {
    const tehai = createTehai("234m234p456s678s55z");
    const config = createConfig("4m", false);

    expect(detectYaku(tehai, config)).toEqual([]);

    const scoreResult = calculateScoreForTehai(tehai, config);
    expect(scoreResult.isErr()).toBe(true);
    if (scoreResult.isErr()) {
      expect(scoreResult.error).toBeInstanceOf(NoYakuError);
    }
  });
});
