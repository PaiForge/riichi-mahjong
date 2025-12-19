import { describe, it, expect } from "vitest";
import { calculateKokushiShanten } from "./kokushi";
import type { HaiId } from "../../../types";
import { HaiKind, MentsuType } from "../../../types";
import { createTehai13 } from "../../../utils/test-helpers";

describe("calculateKokushiShanten", () => {
  it("通常のシャンテン数が正しく計算されること (10種, 対子なし)", () => {
    // 1,9m, 1,9p, 1,9s, 東, 南, 西, 北 (10種) + 他の牌3枚 (Yaochu以外)
    const hais = [
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
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4, // 么九牌以外
    ];
    // 13 - 10 - 0 = 3
    expect(calculateKokushiShanten(createTehai13(hais))).toBe(3);
  });

  it("対子がある場合のシャンテン数が正しく計算されること (10種 + 1対子)", () => {
    // 10種類 + 1対子 (種類としてダブるので実質10種類の牌 + 不要牌)
    // 意図：10種類揃っていて、そのうち1つが対子になっているケース
    // m1, m9, p1, p9, s1, s9, 東(2), 南, 西, 北
    // 種類数: 10. 対子あり.
    // シャンテン = 13 - 10 - 1 = 2.
    const hais = [
      HaiKind.ManZu1,
      HaiKind.ManZu9,
      HaiKind.PinZu1,
      HaiKind.PinZu9,
      HaiKind.SouZu1,
      HaiKind.SouZu9,
      HaiKind.Ton,
      HaiKind.Ton, // 対子
      HaiKind.Nan,
      HaiKind.Sha,
      HaiKind.Pei,
      HaiKind.ManZu2,
      HaiKind.ManZu3, // 不要牌
    ];
    expect(calculateKokushiShanten(createTehai13(hais))).toBe(2);
  });

  it("聴牌（0シャンテン） - 13面待ちの場合", () => {
    // 13種類, 対子なし. 対子ができるのを待っている状態.
    // 13 - 13 - 0 = 0.
    const hais = [
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
    ];
    expect(calculateKokushiShanten(createTehai13(hais))).toBe(0);
  });

  it("聴牌（0シャンテン） - 単騎待ちの場合", () => {
    // 12種類 + 1対子 (12種類のうちの1つ).
    // 13 - 12 - 1 = 0.
    const hais2 = [
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
      HaiKind.Haku, // 12種類目で対子
      HaiKind.Hatsu, // 12種類目とは別の種類だが、リスト全体で12種類にするには...
      // 上記だと m1,m9,p1,p9,s1,s9,東,南,西,北,白,白,發
      // 種類: 13種類ある？ m1..s9(6) + 東南西北(4) + 白(1) + 發(1) = 12種類.
      // 白が2枚なので対子あり.
      // よって 13 - 12 - 1 = 0.
    ];
    expect(calculateKokushiShanten(createTehai13(hais2))).toBe(0);
  });

  it("和了（-1シャンテン）の場合", () => {
    // 13枚の手牌に対する計算なので、和了形（14枚）は考慮しない（0シャンテンが最小）
  });

  it("副露がある場合はInfinityを返すこと", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu2,
        HaiKind.ManZu2,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.ManZu3,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu4,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
      ], // 10 remaining tiles
      exposed: [
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1] as const,
        }, // 3 tiles
      ],
    };
    expect(calculateKokushiShanten(tehai)).toBe(Infinity);
  });

  it("Tehai<HaiId>（ID >= 34を含む）を用いて正しく計算できること", () => {
    // 筒子 (9-17) は ID 36-71 に対応.
    // 1筒 (ID 36), 9筒 (ID 68).
    // 1索 (ID 72), 9索 (ID 104).
    // 字牌 (108-135).
    // 13種類の么九牌を構成 (0シャンテン, 13面待ち).
    const hais = [
      0, // 1萬
      32, // 9萬 (ID 32 は 9萬 の範囲: 32-35)
      36, // 1筒
      68, // 9筒
      72, // 1索
      104, // 9索
      108, // 東
      112, // 南
      116, // 西
      120, // 北
      124, // 白
      128, // 發
      132, // 中
    ] as HaiId[];
    // 13種類. 対子なし.
    // シャンテン = 13 - 13 - 0 = 0.
    expect(calculateKokushiShanten(createTehai13(hais))).toBe(0);
  });
});
