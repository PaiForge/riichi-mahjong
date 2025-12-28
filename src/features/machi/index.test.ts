import { describe, it, expect } from "vitest";
import { getUkeire } from "./index";
import { createTehai, createHaiKindIds } from "../../utils/test-helpers";
import { HaiKind } from "../../types";

describe("getUkeire (待ち/受け入れ判定)", () => {
  describe("聴牌 (Tenpai)", () => {
    it("両面待ち+ノベタンの有効牌を正しく返すこと", () => {
      // 123m 456s 78s 11z 222p (6s, 9s 待ち + 456sとの複合で3sも待ち)
      const tehai = createTehai("123m456s78s11z222p");
      const ukeire = getUkeire(tehai);

      const expected = createHaiKindIds("369s");
      expect(ukeire).toEqual(expect.arrayContaining(expected));
      expect(ukeire).toHaveLength(3);
    });

    it("単騎待ちの有効牌を正しく返すこと", () => {
      // 123m 456s 789p 222z 5m (5m 単騎)
      const tehai = createTehai("123m456s789p222z5m");
      const ukeire = getUkeire(tehai);

      const expected = [HaiKind.ManZu5];
      expect(ukeire).toEqual(expected);
    });

    it("シャンポン待ちの有効牌を正しく返すこと", () => {
      // 123m 456s 11p 22z 333m (1p, 2z シャンポン)
      const tehai = createTehai("123m456s11p22z333m");
      const ukeire = getUkeire(tehai);

      const expected = createHaiKindIds("1p2z");
      expect(ukeire).toEqual(expect.arrayContaining(expected));
      expect(ukeire).toHaveLength(2);
    });

    it("変則多面待ちの有効牌を正しく返すこと", () => {
      // 23456m 44p 666s 777z (1-4-7m)
      const tehai = createTehai("23456m44p666s777z");
      const ukeire = getUkeire(tehai);

      const expected = createHaiKindIds("147m");
      expect(ukeire).toEqual(expect.arrayContaining(expected));
      expect(ukeire).toHaveLength(3);
    });
  });

  describe("1シャンテン (1-Shanten)", () => {
    it("完全1シャンテン的な形の有効牌を正しく返すこと", () => {
      // 123m 456s 13p 78p 11z 5m
      // 2面子, 1雀頭, 2塔子, 1浮き (5m)
      const tehai = createTehai("123m456s13p78p11z5m");
      const ukeire = getUkeire(tehai);

      // 塔子を完成させる牌: 2p, 6p, 9p
      // 5mが縦に重なっても(55m)、塔子オーバーでシャンテン数は変わらないため有効牌ではない
      const expected = createHaiKindIds("2p69p");
      expect(ukeire).toEqual(expect.arrayContaining(expected));
      expect(ukeire).toHaveLength(3);
    });

    it("くっつきテンパイを目指す形の有効牌を正しく返すこと", () => {
      // Hand: 123m 456p 789s 11z 4m 6p
      // 3+3+3+2+1+1 = 13.
      // Ukeire for 4m: 2m,3m,4m,5m,6m.
      // Ukeire for 6p: 4p,5p,6p,7p,8p.
      const tehai = createTehai("123m456p789s11z4m6p");
      const ukeire = getUkeire(tehai);

      // 4m -> 2,3,4,5,6m. Also 1m works (123m 4m + 1m -> 11m 234m).
      // 6p -> 4,5,6,7,8p. Also 3p works (456p 6p + 3p -> 345p 66p).
      // 11z -> 1z works (11z + 1z -> 111z, making 4 mentsu).
      const expectedCoords = [
        ...createHaiKindIds("123456m"),
        ...createHaiKindIds("345678p"),
        HaiKind.Ton,
      ];

      expect(ukeire).toEqual(expect.arrayContaining(expectedCoords));
      expect(ukeire).toHaveLength(13);
    });
  });

  describe("その他", () => {
    it("国士無双などの特殊役は対象外（今回は面子手のみ）", () => {
      const tehai = createTehai("19m19p19s123456z1m");
      const ukeire = getUkeire(tehai);
      expect(Array.isArray(ukeire)).toBe(true);
    });
  });
});
