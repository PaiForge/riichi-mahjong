import { describe, it, expect } from "vitest";
import { selectHouraInterpretation } from "./index";
import { detectYaku } from "../yaku";
import { calculateScoreForTehai } from "../score";
import { NoYakuError } from "../../errors";
import { createTehai, getHaiKindId } from "../../utils/test-helpers";
import { HaiKind } from "../../types";
import type { HouraContext } from "../yaku/types";

/** テスト用の和了コンテキスト（門前・場風東・自風南・ドラなし）を作る */
function createContext(agari: string, isTsumo: boolean): HouraContext {
  return {
    isMenzen: true,
    agariHai: getHaiKindId(agari),
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    isTsumo,
    doraMarkers: [],
  };
}

/** テスト用の点数計算コンフィグ（子・場風東・自風南・ドラなし）を作る */
function createConfig(agari: string, isTsumo: boolean) {
  return {
    agariHai: getHaiKindId(agari),
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    isTsumo,
    doraMarkers: [],
  } as const;
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
      const scoreResult = calculateScoreForTehai(tehai, config);
      if (scoreResult.isErr()) throw scoreResult.error;

      expect(scoreResult.value.detail?.yakuResult).toEqual(yakuResult);
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
