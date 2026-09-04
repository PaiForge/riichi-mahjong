import { describe, it, expect } from "vitest";
import { kokushiDefinition } from "./kokushi";
import type { HouraContext } from "../../types";
import { HaiKind } from "../../../../types";
import type { KokushiHouraStructure } from "../../types";

describe("国士無双の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [],
  };

  it("国士無双形の構造に対して成立すること", () => {
    const hand: KokushiHouraStructure = {
      type: "Kokushi",
      yaochu: [
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
      ],
      jantou: HaiKind.ManZu1,
    };
    expect(kokushiDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(kokushiDefinition.getHansu(hand, baseContext)).toBe(13);
  });

  describe("十三面待ちダブルルール", () => {
    const yaochu13 = [
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
    ] as const;

    it("十三面待ち（雀頭＝和了牌）は、ルール有効なら26翻（ダブル役満）であること", () => {
      const hand: KokushiHouraStructure = {
        type: "Kokushi",
        yaochu: [...yaochu13],
        jantou: HaiKind.ManZu1,
      };
      const context: HouraContext = {
        ...baseContext,
        agariHai: HaiKind.ManZu1,
        yakumanRuleConfig: { kokushiMusouJuusanmen: true },
      };

      expect(kokushiDefinition.getHansu(hand, context)).toBe(26);
    });

    it("単騎待ち（雀頭≠和了牌）は、ルール有効でも13翻であること", () => {
      // 中が雀頭で確定しており、欠けていた1mを待つ単騎待ち
      const hand: KokushiHouraStructure = {
        type: "Kokushi",
        yaochu: [...yaochu13],
        jantou: HaiKind.Chun,
      };
      const context: HouraContext = {
        ...baseContext,
        agariHai: HaiKind.ManZu1,
        yakumanRuleConfig: { kokushiMusouJuusanmen: true },
      };

      expect(kokushiDefinition.getHansu(hand, context)).toBe(13);
    });

    it("十三面待ちでも、既定（ルール設定なし）では13翻であること", () => {
      const hand: KokushiHouraStructure = {
        type: "Kokushi",
        yaochu: [...yaochu13],
        jantou: HaiKind.ManZu1,
      };
      const context: HouraContext = {
        ...baseContext,
        agariHai: HaiKind.ManZu1,
      };

      expect(kokushiDefinition.getHansu(hand, context)).toBe(13);
    });
  });
});
