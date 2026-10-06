import { describe, it, expect } from "vitest";
import {
  analyzeIshokuPattern,
  combinations3,
  countAnkou,
  countShuntsuPairs,
  countSpecificKoutsu,
} from "./helpers";
import {
  createChiitoitsuStructureFromMspz,
  createHouraContext,
  createMentsuStructureFromMspz,
  createTehai,
  withAgari,
} from "../../../utils/test-helpers";
import { getHouraStructuresForKokushi } from "./structures/kokushi";
import { getHouraStructuresForMentsuTe } from "./structures/mentsu-te";
import { HaiKind, HaiType } from "../../../types";
import { KAZEHAI_KIND_IDS, SANGENPAI_KIND_IDS } from "../../../core/hai";

describe("役判定ヘルパー", () => {
  describe("暗刻の数 (countAnkou)", () => {
    it("ツモ和了では副露していない刻子・槓子をすべて暗刻として数えること", () => {
      // 111m 222m 333m 456p 99s (ツモ)
      const hand = createMentsuStructureFromMspz("111m222m333m456p99s");
      const context = createHouraContext({ isTsumo: true });

      expect(countAnkou(hand, context)).toBe(3);
    });

    it("ロン和了で和了牌を含む刻子は暗刻として数えないこと（シャボ待ち）", () => {
      // 111m 222m 333p 456s 99s (ロン 1m)
      const hand = createMentsuStructureFromMspz("111m222m333p456s99s", {
        hai: "1m",
        in: "111m",
      });
      const context = createHouraContext({
        isTsumo: false,
        agariHai: HaiKind.ManZu1,
      });

      expect(countAnkou(hand, context)).toBe(2);
    });

    it("ロン和了でも単騎待ちなら和了牌と同じ牌種の刻子を暗刻として数えること", () => {
      // 111m 222m 333p 456s 11z (ロン 1z: 単騎)
      // 刻子に和了牌は含まれないが、単騎判定の分岐を通ることを確認する
      const hand = createMentsuStructureFromMspz("111m222m333p456s11z", {
        hai: "1z",
        in: "Jantou",
      });
      const context = createHouraContext({
        isTsumo: false,
        agariHai: HaiKind.Ton,
      });

      expect(countAnkou(hand, context)).toBe(3);
    });

    it("副露した刻子は暗刻として数えないこと", () => {
      // [111m] 222m 333p 456s 99s (ツモ)
      const hand = createMentsuStructureFromMspz("222m333p456s99s[111m]");
      const context = createHouraContext({ isTsumo: true, isMenzen: false });

      expect(countAnkou(hand, context)).toBe(2);
    });

    it("面子手以外は 0 を返すこと", () => {
      const hand = createChiitoitsuStructureFromMspz("11223344556677m");
      const context = createHouraContext({ isTsumo: true });

      expect(countAnkou(hand, context)).toBe(0);
    });
  });

  describe("特定牌種の刻子数 (countSpecificKoutsu)", () => {
    it("指定した牌種からなる刻子・槓子だけを数えること", () => {
      // 111z 222z 555z 123m 99s → 風牌の刻子 2 つ、三元牌の刻子 1 つ
      const hand = createMentsuStructureFromMspz("111z222z555z123m99s");

      expect(countSpecificKoutsu(hand, KAZEHAI_KIND_IDS)).toBe(2);
      expect(countSpecificKoutsu(hand, SANGENPAI_KIND_IDS)).toBe(1);
    });

    it("該当する刻子が無ければ 0 を返すこと", () => {
      const hand = createMentsuStructureFromMspz("123m456p789s111m99s");

      expect(countSpecificKoutsu(hand, KAZEHAI_KIND_IDS)).toBe(0);
    });
  });

  describe("3 要素の組み合わせ (combinations3)", () => {
    it("元の順序を保った全ての組み合わせを列挙すること", () => {
      expect(combinations3([1, 2, 3, 4])).toEqual([
        [1, 2, 3],
        [1, 2, 4],
        [1, 3, 4],
        [2, 3, 4],
      ]);
    });

    it("要素が 3 つ未満なら空配列を返すこと", () => {
      expect(combinations3([1, 2])).toEqual([]);
      expect(combinations3([])).toEqual([]);
    });
  });

  describe("同一順子のペア数 (countShuntsuPairs)", () => {
    it("同じ順子が 2 つあれば 1 ペアと数えること", () => {
      // 112233m 456p 789s 99s → 123m x2
      const hand = createMentsuStructureFromMspz("112233m456p789s99s");

      expect(countShuntsuPairs(hand)).toBe(1);
    });

    it("同じ順子が 4 つあれば 2 ペアと数えること", () => {
      // 111122223333m 99s → 123m x4 と解釈される分解を使う
      const hands = createTehai("111122223333m99s");
      const structures = getHouraStructuresForMentsuTe(hands);
      const fourShuntsu = structures.find((s) =>
        s.fourMentsu.every((m) => m.type === "Shuntsu"),
      );
      if (!fourShuntsu) throw new Error("順子 4 つの分解が得られること");

      expect(countShuntsuPairs(withAgari(fourShuntsu))).toBe(2);
    });

    it("面子手以外は 0 を返すこと", () => {
      const hand = createChiitoitsuStructureFromMspz("11223344556677m");

      expect(countShuntsuPairs(hand)).toBe(0);
    });
  });

  describe("一色系パターンの分析 (analyzeIshokuPattern)", () => {
    it("面子手で数牌が 1 種のみなら牌種タイプを返すこと", () => {
      // 123m 456m 789m 111z 99m → 字牌あり、数牌は萬子のみ
      const hand = createMentsuStructureFromMspz("123m456m789m111z99m");

      expect(analyzeIshokuPattern(hand)).toEqual({
        hasJihai: true,
        suupaiSuit: HaiType.Manzu,
      });
    });

    it("数牌が複数種なら suupaiSuit は undefined になること", () => {
      const hand = createMentsuStructureFromMspz("123m456p789s111z99m");

      expect(analyzeIshokuPattern(hand)).toEqual({
        hasJihai: true,
        suupaiSuit: undefined,
      });
    });

    it("字牌のみ（数牌なし）なら suupaiSuit は undefined になること", () => {
      const hand = createMentsuStructureFromMspz("111z222z333z444z55z");

      expect(analyzeIshokuPattern(hand)).toEqual({
        hasJihai: true,
        suupaiSuit: undefined,
      });
    });

    it("七対子も分析対象になること", () => {
      const hand = createChiitoitsuStructureFromMspz("11223344556677p");

      expect(analyzeIshokuPattern(hand)).toEqual({
        hasJihai: false,
        suupaiSuit: HaiType.Pinzu,
      });
    });

    it("国士無双は undefined を返すこと", () => {
      const tehai = createTehai("19m19p19s12345677z");
      const hand = getHouraStructuresForKokushi(tehai)[0];
      if (!hand) throw new Error("国士無双として構造化できること");

      expect(analyzeIshokuPattern(hand)).toBeUndefined();
    });
  });
});
