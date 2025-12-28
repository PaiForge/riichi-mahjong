import { describe, it, expect } from "vitest";
import { getHouraStructuresForMentsuTe } from "./mentsu-te";
import { createTehai, createHaiKindIds } from "../../../../utils/test-helpers";
import { MentsuType, CompletedMentsu } from "../../../../types";

describe("getHouraStructuresForMentsuTe", () => {
  describe("門前手 (Menzen)", () => {
    it("平和の和了を構造化できること", () => {
      // 123m 234p 567s 789s 11z
      const hand = createTehai("123m234p567s789s11z");
      const results = getHouraStructuresForMentsuTe(hand);

      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      if (!result) throw new Error("No result found");

      expect(result.type).toBe("Mentsu");
      expect(result.type).toBe("Mentsu");

      expect(result.fourMentsu).toHaveLength(4);

      // 順子チェック
      const shuntsuList = result.fourMentsu.filter(
        (m: CompletedMentsu) => m.type === MentsuType.Shuntsu,
      );
      expect(shuntsuList).toHaveLength(4);

      // 各順子の構成牌チェック (順序は保証されないため、存在確認を行う)
      const expectedSequences = [
        createHaiKindIds("123m"),
        createHaiKindIds("234p"),
        createHaiKindIds("567s"),
        createHaiKindIds("789s"),
      ];

      for (const expected of expectedSequences) {
        const found = shuntsuList.some(
          (m: CompletedMentsu) =>
            m.hais[0] === expected[0] &&
            m.hais[1] === expected[1] &&
            m.hais[2] === expected[2],
        );
        expect(found).toBe(true);
      }

      // 雀頭チェック
      expect(result.jantou.type).toBe(MentsuType.Toitsu);
      const expectedPair = createHaiKindIds("11z");
      expect(result.jantou.hais).toEqual(expect.arrayContaining(expectedPair));
    });
  });

  describe("副露手 (Exposed / Open Hand)", () => {
    it("チーを含む手を構造化できること", () => {
      // 123m 456s 789s 22m [456p] (Chi)
      const hand = createTehai("123m456s789s22m[456p]");
      const results = getHouraStructuresForMentsuTe(hand);

      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      if (!result) throw new Error("No result found");

      // 副露順子の確認
      const exposedShuntsu = result.fourMentsu.find(
        (m: CompletedMentsu) =>
          m.type === MentsuType.Shuntsu && m.furo !== undefined,
      );
      expect(exposedShuntsu).toBeDefined();
      const expectedIds = createHaiKindIds("456p");
      if (!exposedShuntsu?.furo) throw new Error("No exposed shuntsu found");

      expect(exposedShuntsu.hais).toEqual(expect.arrayContaining(expectedIds));
      expect(exposedShuntsu.furo.type).toBe("Chi");

      // 門前順子の確認
      const closedShuntsu = result.fourMentsu.filter(
        (m: CompletedMentsu) =>
          m.type === MentsuType.Shuntsu && m.furo === undefined,
      );
      expect(closedShuntsu).toHaveLength(3); // 123m, 456s, 789s
    });

    it("ポン（刻子副露）を含む手を構造化できること", () => {
      // 123m 456s 789s 22m [888p] (Pon)
      const hand = createTehai("123m456s789s22m[888p]");
      const results = getHouraStructuresForMentsuTe(hand);

      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      if (!result) throw new Error("No result found");

      // 副露刻子の確認
      const exposedKoutsu = result.fourMentsu.find(
        (m: CompletedMentsu) =>
          m.type === MentsuType.Koutsu && m.furo !== undefined,
      );
      expect(exposedKoutsu).toBeDefined();
      const expectedIds = createHaiKindIds("888p");
      if (!exposedKoutsu?.furo) throw new Error("No exposed koutsu found");

      expect(exposedKoutsu.hais).toEqual(expect.arrayContaining(expectedIds));
      expect(exposedKoutsu.furo.type).toBe("Pon");
    });

    it("大明槓を含む手を構造化できること", () => {
      // 123m 456s 789p 22m [2222s] (Daiminkan)
      const hand = createTehai("123m456s789p22m[2222s]");
      const results = getHouraStructuresForMentsuTe(hand);

      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      if (!result) throw new Error("No result found");

      // 槓子の確認
      const kantsu = result.fourMentsu.find(
        (m: CompletedMentsu) => m.type === MentsuType.Kantsu,
      );
      expect(kantsu).toBeDefined();
      const expectedIds = createHaiKindIds("2222s");
      if (!kantsu?.furo) throw new Error("No kantsu found");

      expect(kantsu.hais).toHaveLength(4);
      expect(kantsu.hais).toEqual(expect.arrayContaining(expectedIds));
      expect(kantsu.furo).toBeDefined();
      expect(kantsu.furo.type).toBe("Daiminkan");
    });
  });

  describe("暗槓 (Ankan)", () => {
    it("暗槓を含む手を構造化できること", () => {
      // 暗槓は表記上 (1111z) のように表され、exposed リストに入るが furo 情報を持たない（または区別される）
      // 123m 456s 789s 22m (1111z)
      const hand = createTehai("123m456s789s22m(1111z)");
      const results = getHouraStructuresForMentsuTe(hand);

      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      if (!result) throw new Error("No result found");

      // 暗槓子の確認
      const ankan = result.fourMentsu.find(
        (m: CompletedMentsu) => m.type === MentsuType.Kantsu,
      );
      expect(ankan).toBeDefined();
      if (!ankan) throw new Error("No ankan found");

      const expectedIds = createHaiKindIds("1111z");
      expect(ankan.hais).toHaveLength(4);
      expect(ankan.hais).toEqual(expect.arrayContaining(expectedIds));

      // 暗槓は furo プロパティを持たない
      expect(ankan.furo).toBeUndefined();
    });
  });

  describe("役なし (Yakunashi)", () => {
    it("役が成立しない手牌（形式聴牌・和了形）でも正しく構造化できること", () => {
      // 役なしの例: 鳴きあり、役牌なし、么九牌含み
      // 123m 789m 123p 11s [789s] (Chi)
      const hand = createTehai("123m789m123p11s[789s]");
      const results = getHouraStructuresForMentsuTe(hand);

      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      if (!result) throw new Error("No result found");

      // 4面子1雀頭であることを確認
      expect(result.fourMentsu).toHaveLength(4);
      expect(result.jantou.type).toBe(MentsuType.Toitsu);

      // 特定の面子が含まれているか
      const expectedExposed = createHaiKindIds("789s");
      const exposed = result.fourMentsu.find(
        (m: CompletedMentsu) => m.furo?.type === "Chi",
      );
      expect(exposed).toBeDefined();
      if (!exposed) throw new Error("No exposed mentsu found");
      expect(exposed.hais).toEqual(expect.arrayContaining(expectedExposed));
    });
  });

  describe("特殊形 (Special Hands - Negative Test)", () => {
    it("七対子形は4面子1雀頭に構造化できず空配列を返すこと", () => {
      const hand = createTehai("11m22m33m44p55p66s77s");
      const results = getHouraStructuresForMentsuTe(hand);
      expect(results).toHaveLength(0);
    });

    it("国士無双形は4面子1雀頭に構造化できず空配列を返すこと", () => {
      const hand = createTehai("19m19p19s1234567z1m");
      const results = getHouraStructuresForMentsuTe(hand);
      expect(results).toHaveLength(0);
    });
  });
});
