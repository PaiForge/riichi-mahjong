import { describe, it, expect } from "vitest";
import { calculateFu } from "./index";
import { createTehai } from "../../../../utils/test-helpers";
import { getHouraStructures } from "../../../yaku/lib/structures";
import { HaiKind } from "../../../../types";
import type { HouraContext } from "../../../yaku/types";
import type { HouraStructure } from "../../../yaku/types";

describe("calculateFu", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    isTsumo: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Ton,
    doraMarkers: [HaiKind.ManZu1], // Default dora marker
  };

  const getStruct = (
    mspz: string,
    type: "Mentsu" | "Chiitoitsu" | "Kokushi" = "Mentsu",
  ): HouraStructure => {
    const tehai = createTehai(mspz);
    const structs = getHouraStructures(tehai);
    const target = structs.find((s) => s.type === type);
    if (!target) throw new Error(`Structure ${type} not found for ${mspz}`);
    return target;
  };

  it("七対子は常に25符", () => {
    const hand = getStruct("11m22m33m44m55m66m77m", "Chiitoitsu");
    const result = calculateFu(hand, baseContext);
    expect(result.total).toBe(25);
    expect(result.details.base).toBe(25);
  });

  describe("平和形の符計算", () => {
    // 234m 456m 789m 234p 99s (Head 9s, Wait 4p - Ryanmen)
    // Agari: 4p (PinZu4) -> 234p wait 1/4 -> Ryanmen
    const pinfuMSPZ = "234m456m789m234p99s";

    it("平和ツモは20符 (特例)", () => {
      const hand = getStruct(pinfuMSPZ);
      const ctx = { ...baseContext, isTsumo: true, agariHai: HaiKind.PinZu4 };

      const result = calculateFu(hand, ctx, true); // isPinfu=true
      expect(result.total).toBe(20);
      expect(result.details.agari).toBe(0); // agari fu suppressed
    });

    it("平和ロンは30符 (基本20 + ロン10 = 30)", () => {
      const hand = getStruct(pinfuMSPZ);
      const ctx = {
        ...baseContext,
        isMenzen: true,
        isTsumo: false,
        agariHai: HaiKind.PinZu4,
      };

      const result = calculateFu(hand, ctx, true); // isPinfu=true
      expect(result.total).toBe(30);
      expect(result.details.base).toBe(20);
      expect(result.details.agari).toBe(10);
      expect(result.details.mentsu).toBe(0);
    });

    it("平和ツモでない場合は特例適用なし (例えば待ちが嵌張)", () => {
      // 123m 456m 789m 13p 99s [Agari 2p] -> Kanchan wait
      // This is NOT Pinfu (because Kanchan). isPinfu=false.
      // Base 20 + Kanchan 2 + Tsumo 2 = 24 -> 30 Fu.
      // Note: We need to construct a hand that looks like Pinfu but isn't Pinfu due to wait?
      // Actually if I pass isPinfu=false to calculateFu, it should calculate normally.
      const hand = getStruct(pinfuMSPZ); // Standard Pinfu shape
      const ctx = { ...baseContext, isTsumo: true, agariHai: HaiKind.PinZu3 };

      const result = calculateFu(hand, ctx, false); // force isPinfu=false
      // Base 20 + Tsumo 2 = 22 -> 30 Fu
      expect(result.total).toBe(30);
      expect(result.details.agari).toBe(2);
    });
  });

  describe("雀頭符の計算", () => {
    // Context: Bakaze=Ton, Jikaze=Ton
    it("役牌でない雀頭は0符", () => {
      // 99m head
      const hand = getStruct("123m456m789m123p99m");
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu3 };
      const result = calculateFu(hand, ctx);
      expect(result.details.jantou).toBe(0);
    });

    it("自風の雀頭は2符", () => {
      // Ton head (Jikaze=Ton)
      const hand = getStruct("123m456m789m123p11z");
      const ctx = {
        ...baseContext,
        jikaze: HaiKind.Ton,
        bakaze: HaiKind.Nan,
        agariHai: HaiKind.ManZu3,
      };
      const result = calculateFu(hand, ctx);
      expect(result.details.jantou).toBe(2);
    });

    it("場風の雀頭は2符", () => {
      // Nan head (Bakaze=Nan)
      const hand = getStruct("123m456m789m123p22z");
      const ctx = {
        ...baseContext,
        jikaze: HaiKind.Ton,
        bakaze: HaiKind.Nan,
        agariHai: HaiKind.ManZu3,
      };
      const result = calculateFu(hand, ctx);
      expect(result.details.jantou).toBe(2);
    });

    it("三元牌の雀頭は2符", () => {
      // Haku head
      const hand = getStruct("123m456m789m123p55z"); // 5z=Haku
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu3 };
      const result = calculateFu(hand, ctx);
      expect(result.details.jantou).toBe(2);
    });

    it("連風牌（ダブ東）の雀頭は2符 (Cap applied)", () => {
      // Ton head, Jikaze=Ton, Bakaze=Ton
      const hand = getStruct("123m456m789m123p11z");
      const ctx = {
        ...baseContext,
        jikaze: HaiKind.Ton,
        bakaze: HaiKind.Ton,
        agariHai: HaiKind.ManZu3,
      };
      const result = calculateFu(hand, ctx);
      expect(result.details.jantou).toBe(2); // 4 capped to 2
    });
  });

  describe("待ち符の計算", () => {
    it("カンチャン待ちは2符", () => {
      // 13m -> 2m
      const hand = getStruct("13m456m789m123p99s2m");
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu2 };
      const result = calculateFu(hand, ctx);
      expect(result.details.machi).toBe(2);
    });

    it("ペンチャン待ちは2符", () => {
      // 12m -> 3m
      const hand = getStruct("12m456m789m123p99s3m");
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu3 };
      const result = calculateFu(hand, ctx);
      expect(result.details.machi).toBe(2);
    });

    it("単騎待ちは2符", () => {
      // 123m 456m 789m 123p 1m (Tanki 1m)
      const hand = getStruct("123m456m789m123p1m1m");
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.machi).toBe(2);
    });

    it("両面待ちは0符", () => {
      // 23m -> 1m/4m
      const hand = getStruct("23m456m789m123p99s1m");
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.machi).toBe(0);
    });

    it("双碰待ちは0符", () => {
      // 11m 22m -> 1m/2m
      // 456m 789m 123p 11m 22m
      const hand = getStruct("456m789m123p11m22m1m");
      const ctx = { ...baseContext, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.machi).toBe(0);
    });
  });

  describe("刻子・槓子の符", () => {
    it("中張牌の明刻は2符", () => {
      // 222m (Open)
      const hand = getStruct("123m456m789m99p[222m]");
      const ctx = { ...baseContext, isMenzen: false, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.mentsu).toBe(2);
    });

    it("中張牌の暗刻は4符", () => {
      // 222m (Closed)
      const hand = getStruct("123m456m789m99p222m");
      const ctx = { ...baseContext, isMenzen: true, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.mentsu).toBe(4);
    });

    it("么九牌の明刻は4符", () => {
      // 111m (Open)
      const hand = getStruct("123m456m789m99p[111m]");
      const ctx = { ...baseContext, isMenzen: false, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.mentsu).toBe(4);
    });

    it("么九牌の暗刻は8符", () => {
      // 111m (Closed)
      const hand = getStruct("123m456m789m99p111m");
      const ctx = { ...baseContext, isMenzen: true, agariHai: HaiKind.ManZu1 };
      const result = calculateFu(hand, ctx);
      expect(result.details.mentsu).toBe(8);
    });

    // Kantsu logic check (using [1111m] notation for Kantsu in test helper?)
    // Note: createTehai helper might not support Kantsu notation fully or it creates [1111m] as exposed kantsu.
    // Assuming [1111m] works for MinKan. Closed Kantsu usually written as 1111m but parsed as Kantsu?
    // Decomposer might treat 1111m as Koutsu + 1 or similar if not explicit.
    // For unit test, we can mock the structure if parser is limited.
    // But let's try assuming standard parsing or just trust calculator logic.
    // Actually, createTehai uses parseMspz. Let's verify Kantsu support.
    // parseMspz does support K: [1111m] (Open Kantsu). (1111m) ? No.
    // Standard mspz uses k for kan. [1k111] ?
    // I will mock structure for Kantsu tests to be safe.
  });

  describe("喰いタン平和形 (オープン20符→30符)", () => {
    it("鳴き平和形は30符に切り上げ", () => {
      // 234m (Chi) + 234s + 234p + 456s + 99m head
      const hand = getStruct("234s234p456s99m[234m]");
      const ctx = {
        ...baseContext,
        isMenzen: false,
        isTsumo: false,
        agariHai: HaiKind.SouZu2,
      }; // Ryanmen wait, etc.
      // Base 20 + Mentsu 0 + Jantou 0 + Machi 0 + Agari 0 = 20
      const result = calculateFu(hand, ctx);
      expect(result.total).toBe(30);
    });
  });
});
