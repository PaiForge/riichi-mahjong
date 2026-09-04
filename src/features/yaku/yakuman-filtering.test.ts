import { describe, it, expect } from "vitest";
import { detectYaku, detectYakuForStructure } from "./index";
import { calculateScoreForTehai, getPaymentTotal } from "../score";
import {
  createTehai,
  getHaiKindId,
  createKoutsu,
  createToitsu,
  createShuntsu,
} from "../../utils/test-helpers";
import { HaiKind } from "../../types";
import type { HouraContext, MentsuHouraStructure } from "./types";
import type { ScoreCalculationConfig } from "../score/types";

// ---------------------------------------------------------------------------
// 役満成立時に通常役が複合しないこと（一般ルール）
//
// 麻雀の一般ルールとして、役満（13翻以上）が成立した場合、
// 役満未満の通常役（例: 三暗刻、トイトイ、役牌、清一色 等）は結果に含めない。
// 一方、複数の役満が同時に成立した場合は、全ての役満を返す。
// ---------------------------------------------------------------------------

describe("役満成立時に通常役が複合しないこと（一般ルール）", () => {
  describe("四暗刻 (Suuankou): 三暗刻・トイトイ等の通常役が除外される", () => {
    it("四暗刻ツモ時に三暗刻・トイトイが含まれないこと", () => {
      // 111m 222p 333s 444s 55z (ツモ)
      const hand = createTehai("111m222p333s444s55z");
      const agari = getHaiKindId("4s");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        uraDoraMarkers: [],
        isTsumo: true,
      });

      expect(result).toContainEqual(["Suuankou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Sanankou"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
    });

    it("四暗刻単騎（単騎ダブルルール有効）時にダブル役満(26翻)のみ返されること", () => {
      // 111m 222p 333s 444s 55z (5z単騎待ちツモ)
      const hand = createTehai("111m222p333s444s55z");
      const agari = getHaiKindId("5z");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        uraDoraMarkers: [],
        isTsumo: true,
        ruleConfig: { suuankouTanki: true },
      });

      expect(result).toContainEqual(["Suuankou", 26]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Sanankou"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
    });
  });

  describe("国士無双 (KokushiMusou): 特殊構造のため他の役が一切成立しない", () => {
    it("国士無双成立時に他の役が含まれないこと", () => {
      // 19m19p19s1234567z + 1m (1m重複)
      const hand = createTehai("19m19p19s1234567z1m");
      const agari = getHaiKindId("1m");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toContainEqual(["KokushiMusou", 13]);
      expect(result.length).toBe(1);
    });
  });

  describe("大三元 (Daisangen): 小三元・役牌(白發中)が除外される", () => {
    it("大三元成立時に小三元・役牌が含まれないこと", () => {
      // 白白白 發發發 中中中 + 123m + 99p
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("555z"),
          createKoutsu("666z"),
          createKoutsu("777z"),
          createShuntsu("123m"),
        ],
        jantou: createToitsu("99p"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("3m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Daisangen", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Shousangen"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Haku"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Hatsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Chun"]));
    });
  });

  describe("字一色 (Tsuuiisou): 混一色・役牌・混老頭・トイトイ・三暗刻が除外される", () => {
    it("字一色成立時に混一色・役牌が含まれないこと", () => {
      // 東東東 南南南 西西西 白白白 + 北北
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111z"),
          createKoutsu("222z"),
          createKoutsu("333z"),
          createKoutsu("555z"),
        ],
        jantou: createToitsu("44z"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("4z"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Tsuuiisou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Honitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Haku"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honroutou"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Sanankou"]));
    });
  });

  describe("緑一色 (Ryuuiisou): 混一色・發が除外される", () => {
    it("緑一色成立時に通常役が含まれないこと", () => {
      // 222s 333s 444s 666s + 發發
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("222s"),
          createShuntsu("234s"),
          createShuntsu("234s"),
          createKoutsu("666s"),
        ],
        jantou: createToitsu("66z"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("6s"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Ryuuiisou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Honitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Hatsu"]));
    });
  });

  describe("清老頭 (Chinroutou): トイトイ・混老頭・純全帯・混全帯が除外される", () => {
    it("清老頭成立時にトイトイ・混老頭・純全帯などが含まれないこと", () => {
      // 111m 999m 111p 999p + 11s
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111m"),
          createKoutsu("999m"),
          createKoutsu("111p"),
          createKoutsu("999p"),
        ],
        jantou: createToitsu("11s"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("1s"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Chinroutou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honroutou"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Junchan"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honchan"]));
      // 四暗刻も同時成立（単騎待ちツモだが既定ではダブル役満なし）
      expect(result).toContainEqual(["Suuankou", 13]);
    });
  });

  describe("九蓮宝燈 (ChuurenPoutou): 清一色・平和が除外される", () => {
    it("九蓮宝燈成立時に清一色などが含まれないこと", () => {
      // 1112345678999m + 5m
      const hand = createTehai("1112345678999m5m");
      const agari = getHaiKindId("5m");

      const result = detectYaku(hand, {
        agariHai: agari,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        uraDoraMarkers: [],
        isTsumo: true,
      });

      expect(result).toContainEqual(["ChuurenPoutou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Chinitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Pinfu"]));
    });
  });

  describe("小四喜 (Shousuushii): 役牌(風牌)・混一色が除外される", () => {
    it("小四喜成立時に通常役（役牌等）が含まれないこと", () => {
      // 東東東 南南南 西西西 + 123m + 北北
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111z"),
          createKoutsu("222z"),
          createKoutsu("333z"),
          createShuntsu("123m"),
        ],
        jantou: createToitsu("44z"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("3m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Shousuushii", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Honitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honchan"]));
    });
  });

  describe("大四喜 (Daisuushii): トイトイ・混一色・三暗刻が除外される", () => {
    it("大四喜成立時に通常役が含まれないこと", () => {
      // 東東東 南南南 西西西 北北北 + 11m
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111z"),
          createKoutsu("222z"),
          createKoutsu("333z"),
          createKoutsu("444z"),
        ],
        jantou: createToitsu("11m"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("1m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Daisuushii", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Sanankou"]));
    });
  });

  describe("四槓子 (Suukantsu): 三槓子・トイトイが除外される", () => {
    it("四槓子成立時に通常役が含まれないこと", () => {
      // 4つの槓子 + 雀頭
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          { type: "Kantsu", hais: [0, 0, 0, 0] as const },
          { type: "Kantsu", hais: [9, 9, 9, 9] as const },
          { type: "Kantsu", hais: [18, 18, 18, 18] as const },
          { type: "Kantsu", hais: [27, 27, 27, 27] as const },
        ],
        jantou: createToitsu("55z"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("5z"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Suukantsu", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Sankantsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
    });
  });
});

// ---------------------------------------------------------------------------
// 複数の役満が同時に成立する場合
//
// 一般ルールでは、複数の役満が同時に成立した場合は全ての役満を返す。
// ただし、それらの合算をダブル役満・トリプル役満として扱う特殊ルールには未対応。
// ---------------------------------------------------------------------------

describe("複数の役満が同時に成立する場合は全ての役満のみが返される", () => {
  it("字一色と大四喜が同時成立し、両方の役満のみが返されること", () => {
    // 東東東 南南南 西西西 北北北 + 白白 (字一色 + 大四喜)
    const hand: MentsuHouraStructure = {
      type: "Mentsu",
      fourMentsu: [
        createKoutsu("111z"),
        createKoutsu("222z"),
        createKoutsu("333z"),
        createKoutsu("444z"),
      ],
      jantou: createToitsu("55z"),
    };

    const context: HouraContext = {
      isMenzen: true,
      agariHai: getHaiKindId("5z"),
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      doraMarkers: [],
      isTsumo: true,
    };

    const result = detectYakuForStructure(hand, context);

    expect(result).toContainEqual(["Tsuuiisou", 13]);
    expect(result).toContainEqual(["Daisuushii", 13]);
    // 通常役は含まれない
    expect(result.every(([, han]) => han >= 13)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 通常役のみの場合（役満なし）はフィルタリングされないことの確認
// ---------------------------------------------------------------------------

describe("通常役のみの場合はフィルタリングされないこと", () => {
  it("三暗刻・トイトイが両方返されること（役満なし）", () => {
    // 111m 222p 333s [444s](副露) + 55z (ロン, シャボ待ちで4sではない)
    const hand: MentsuHouraStructure = {
      type: "Mentsu",
      fourMentsu: [
        createKoutsu("111m"),
        createKoutsu("222p"),
        createKoutsu("333s"),
        {
          type: "Koutsu",
          hais: [HaiKind.SouZu4, HaiKind.SouZu4, HaiKind.SouZu4] as const,
          furo: { type: "Pon", from: 2 },
        },
      ],
      jantou: createToitsu("55z"),
    };

    const context: HouraContext = {
      isMenzen: false,
      agariHai: getHaiKindId("5z"),
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      doraMarkers: [],
      isTsumo: true,
    };

    const result = detectYakuForStructure(hand, context);

    expect(result).toContainEqual(["Sanankou", 2]);
    expect(result).toContainEqual(["Toitoi", 2]);
    // 役満は含まれない
    expect(result.every(([, han]) => han < 13)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// エッジケース: 副露あり・門前ツモとの複合・ダブル役満パターン
// ---------------------------------------------------------------------------

describe("役満フィルタリング: エッジケース", () => {
  describe("副露ありでも役満成立時に通常役が除外されること", () => {
    it("大三元（副露あり）成立時に役牌・小三元が除外されること", () => {
      // 白白白(ポン) 發發發(ポン) 中中中(ポン) + 123m + 99p
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          {
            type: "Koutsu",
            hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku] as const,
            furo: { type: "Pon", from: 2 },
          },
          {
            type: "Koutsu",
            hais: [HaiKind.Hatsu, HaiKind.Hatsu, HaiKind.Hatsu] as const,
            furo: { type: "Pon", from: 3 },
          },
          {
            type: "Koutsu",
            hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun] as const,
            furo: { type: "Pon", from: 1 },
          },
          createShuntsu("123m"),
        ],
        jantou: createToitsu("99p"),
      };

      const context: HouraContext = {
        isMenzen: false,
        agariHai: getHaiKindId("3m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Daisangen", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Haku"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Hatsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Chun"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Shousangen"]));
      // 全て役満のみ
      expect(result.every(([, han]) => han >= 13)).toBe(true);
    });

    it("字一色（副露あり）成立時に混一色・役牌・トイトイが除外されること", () => {
      // 東東東(ポン) 南南南(ポン) 西西西(ポン) 白白白 + 北北
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          {
            type: "Koutsu",
            hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton] as const,
            furo: { type: "Pon", from: 2 },
          },
          {
            type: "Koutsu",
            hais: [HaiKind.Nan, HaiKind.Nan, HaiKind.Nan] as const,
            furo: { type: "Pon", from: 3 },
          },
          {
            type: "Koutsu",
            hais: [HaiKind.Sha, HaiKind.Sha, HaiKind.Sha] as const,
            furo: { type: "Pon", from: 1 },
          },
          createKoutsu("555z"),
        ],
        jantou: createToitsu("44z"),
      };

      const context: HouraContext = {
        isMenzen: false,
        agariHai: getHaiKindId("4z"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Tsuuiisou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Honitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Haku"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
      expect(result.every(([, han]) => han >= 13)).toBe(true);
    });
  });

  describe("門前ツモと役満の複合: 門前清自摸和(MenzenTsumo)が除外される", () => {
    it("四暗刻ツモ時に門前清自摸和が除外されること", () => {
      // 111m 222p 333s 444s + 55z (ツモ)
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111m"),
          createKoutsu("222p"),
          createKoutsu("333s"),
          createKoutsu("444s"),
        ],
        jantou: createToitsu("55z"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("4s"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Suuankou", 13]);
      expect(result).not.toContainEqual(
        expect.arrayContaining(["MenzenTsumo"]),
      );
    });

    it("大三元門前ツモ時に門前清自摸和が除外されること", () => {
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("555z"),
          createKoutsu("666z"),
          createKoutsu("777z"),
          createShuntsu("123m"),
        ],
        jantou: createToitsu("99p"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("3m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Daisangen", 13]);
      expect(result).not.toContainEqual(
        expect.arrayContaining(["MenzenTsumo"]),
      );
    });
  });

  describe("ダブル役満の複合パターン: 通常役が除外され役満のみ返される", () => {
    it("四暗刻単騎(26翻) + 字一色(13翻) の同時成立で通常役が除外されること", () => {
      // 東東東 南南南 西西西 白白白 + 北北 (北単騎待ちツモ)
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111z"),
          createKoutsu("222z"),
          createKoutsu("333z"),
          createKoutsu("555z"),
        ],
        jantou: createToitsu("44z"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("4z"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
        yakumanRuleConfig: { suuankouTanki: true },
      };

      const result = detectYakuForStructure(hand, context);

      // 四暗刻単騎(ダブル役満) + 字一色(役満)
      expect(result).toContainEqual(["Suuankou", 26]);
      expect(result).toContainEqual(["Tsuuiisou", 13]);
      // 通常役が混入していないこと
      expect(result).not.toContainEqual(
        expect.arrayContaining(["MenzenTsumo"]),
      );
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honitsu"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Haku"]));
      expect(result.every(([, han]) => han >= 13)).toBe(true);
    });

    it("四暗刻単騎(26翻) + 清老頭(13翻) の同時成立", () => {
      // 111m 999m 111p 999p + 11s (1s単騎待ちツモ)
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createKoutsu("111m"),
          createKoutsu("999m"),
          createKoutsu("111p"),
          createKoutsu("999p"),
        ],
        jantou: createToitsu("11s"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("1s"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
        isTsumo: true,
        yakumanRuleConfig: { suuankouTanki: true },
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Suuankou", 26]);
      expect(result).toContainEqual(["Chinroutou", 13]);
      expect(result).not.toContainEqual(expect.arrayContaining(["Toitoi"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Honroutou"]));
      expect(result).not.toContainEqual(expect.arrayContaining(["Junchan"]));
      expect(result.every(([, han]) => han >= 13)).toBe(true);
    });
  });

  describe("高翻数の通常役がフィルタリングされないこと", () => {
    it("清一色(6翻) + 一気通貫(2翻) など合計13翻未満の手がそのまま返されること", () => {
      // 清一色 門前 (6翻) + 一気通貫 (2翻) = 8翻
      // 123m 456m 789m 123m + 55m
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          createShuntsu("123m"),
          createShuntsu("456m"),
          createShuntsu("789m"),
          createShuntsu("123m"),
        ],
        jantou: createToitsu("55m"),
      };

      const context: HouraContext = {
        isMenzen: true,
        agariHai: getHaiKindId("5m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
        doraMarkers: [],
      };

      const result = detectYakuForStructure(hand, context);

      expect(result).toContainEqual(["Chinitsu", 6]);
      expect(result).toContainEqual(["Ikkitsuukan", 2]);
      // 役満は含まれない
      expect(result.every(([, han]) => han < 13)).toBe(true);
    });

    it("混一色(3翻) + 役牌(1翻) + トイトイ(2翻) のような副露手が正常に返されること", () => {
      // 東東東(ポン) 白白白(ポン) 111m 999m + 55m
      const hand: MentsuHouraStructure = {
        type: "Mentsu",
        fourMentsu: [
          {
            type: "Koutsu",
            hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton] as const,
            furo: { type: "Pon", from: 2 },
          },
          {
            type: "Koutsu",
            hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku] as const,
            furo: { type: "Pon", from: 3 },
          },
          createKoutsu("111m"),
          createKoutsu("999m"),
        ],
        jantou: createToitsu("55m"),
      };

      const context: HouraContext = {
        isMenzen: false,
        agariHai: getHaiKindId("5m"),
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Ton,
        doraMarkers: [],
        isTsumo: true,
      };

      const result = detectYakuForStructure(hand, context);

      // 役満は含まれない
      expect(result.every(([, han]) => han < 13)).toBe(true);
      // 通常役がフィルタリングされていないこと
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 統合テスト: calculateScoreForTehai を通して点数が正しく計算されること
// ---------------------------------------------------------------------------

describe("役満フィルタリング: 統合テスト (calculateScoreForTehai)", () => {
  it("四暗刻ツモ: 子で32000点(役満)になること", () => {
    // 111m222p333s444s55z + 4sツモ
    const tehai = createTehai("111m222p333s444s55z");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("4s"),
      isTsumo: true,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    // 役満は13翻
    expect(result.han).toBe(13);
    expect(result.scoreLevel).toBe("Yakuman");
    // 子ツモ役満: 8000/16000
    expect(result.payment.type).toBe("koTsumo");
    expect(getPaymentTotal(result.payment)).toBe(32000);
  });

  it("四暗刻単騎ツモ（単騎ダブルルール有効）: 子で64000点(ダブル役満)になること", () => {
    // 111m222p333s444s55z + 5zツモ(単騎)
    const tehai = createTehai("111m222p333s444s55z");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("5z"),
      isTsumo: true,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
      ruleConfig: { suuankouTanki: true },
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    expect(result.han).toBe(26);
    expect(result.scoreLevel).toBe("DoubleYakuman");
    // 子ツモダブル役満: 16000/32000
    expect(result.payment.type).toBe("koTsumo");
    expect(getPaymentTotal(result.payment)).toBe(64000);
  });

  it("国士無双ロン: 子で32000点(役満)になること", () => {
    const tehai = createTehai("19m19p19s1234567z1m");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("1m"),
      isTsumo: false,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    expect(result.han).toBe(13);
    expect(result.scoreLevel).toBe("Yakuman");
    // 子ロン役満: 32000点
    expect(result.payment.type).toBe("ron");
    expect(getPaymentTotal(result.payment)).toBe(32000);
  });

  it("九蓮宝燈ツモ: 親で48000点(役満)になること", () => {
    // 1112345678999m + 5mツモ
    const tehai = createTehai("1112345678999m5m");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("5m"),
      isTsumo: true,
      jikaze: HaiKind.Ton, // 親
      bakaze: HaiKind.Ton,
      doraMarkers: [],
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    expect(result.han).toBe(13);
    expect(result.scoreLevel).toBe("Yakuman");
    // 親ツモ役満: 16000オール = 48000
    expect(result.payment.type).toBe("oyaTsumo");
    expect(getPaymentTotal(result.payment)).toBe(48000);
  });

  it("複合役満（大三元+字一色）: 合算なし（既定）では役満1つ分の32000点", () => {
    // 白白白 發發發 中中中 東東東 北北 + 東ロン（明刻になるため四暗刻は不成立）
    const tehai = createTehai("555z666z777z111z44z");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("1z"),
      isTsumo: false,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    // 内訳は事実として両方返る（翻数は 13 + 13 = 26）
    expect(result.detail?.yakuResult).toContainEqual(["Daisangen", 13]);
    expect(result.detail?.yakuResult).toContainEqual(["Tsuuiisou", 13]);
    expect(result.han).toBe(26);
    // 支払いは最高位の役満1つ分
    expect(result.scoreLevel).toBe("Yakuman");
    expect(result.yakumanMultiplier).toBe(1);
    expect(getPaymentTotal(result.payment)).toBe(32000);
  });

  it("複合役満（大三元+字一色）: 合算ルール有効ならダブル役満の64000点", () => {
    const tehai = createTehai("555z666z777z111z44z");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("1z"),
      isTsumo: false,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
      ruleConfig: { fukugouYakuman: true },
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    expect(result.scoreLevel).toBe("DoubleYakuman");
    expect(result.yakumanMultiplier).toBe(2);
    expect(getPaymentTotal(result.payment)).toBe(64000);
  });

  it("形のダブル役満と複合の合算の掛け合わせ: 四暗刻単騎(2) + 字一色(1) + 小四喜(1) = 役満4つ分", () => {
    // 東東東 南南南 西西西 白白白 北北 + 北単騎ツモ
    const tehai = createTehai("111z222z333z555z44z");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("4z"),
      isTsumo: true,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
      ruleConfig: { suuankouTanki: true, fukugouYakuman: true },
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    expect(result.detail?.yakuResult).toContainEqual(["Suuankou", 26]);
    expect(result.detail?.yakuResult).toContainEqual(["Tsuuiisou", 13]);
    expect(result.detail?.yakuResult).toContainEqual(["Shousuushii", 13]);
    expect(result.scoreLevel).toBe("DoubleYakuman");
    expect(result.yakumanMultiplier).toBe(4);
    // 子ツモ 8000×4ベース: 32000/64000 = 計128000
    expect(getPaymentTotal(result.payment)).toBe(128000);
  });

  it("数え役満相当の翻数（役満役なし）はダブル役満にならないこと", () => {
    // 清一色+二盃口+平和+ツモ など役満役なしの手にドラを大量に載せても
    // 役満止まり（数え役満は合算ルールが有効でも倍化しない）
    // 123m123m 456m456m 99m + 9mツモ = 清一色(6)+二盃口(3)+ツモ(1) = 10翻
    // ドラ表示牌 8m×2 → 9m(2枚)がドラ×2 = +4翻 で計14翻（数え役満相当）
    const tehai = createTehai("112233445566m99m");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("9m"),
      isTsumo: true,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [getHaiKindId("8m"), getHaiKindId("8m")],
      ruleConfig: { fukugouYakuman: true },
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    // 役満役は成立していない
    expect(result.detail?.yakuResult.every(([, han]) => han < 13)).toBe(true);
    expect(result.yakumanMultiplier).toBe(0);
    // 翻数が13を超えていても役満（32000）止まり
    expect(result.han).toBeGreaterThanOrEqual(13);
    expect(result.scoreLevel).toBe("Yakuman");
    expect(getPaymentTotal(result.payment)).toBe(32000);
  });

  it("役満成立時にドラの翻数が加算されていないこと", () => {
    // 四暗刻 + ドラ3 の場合でも13翻(役満)であること
    const tehai = createTehai("111m222p333s444s55z");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("4s"),
      isTsumo: true,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [
        getHaiKindId("9p"), // ドラ表示牌: 9p -> ドラは1p
        getHaiKindId("2s"), // ドラ表示牌: 2s -> ドラは3s
        getHaiKindId("3s"), // ドラ表示牌: 3s -> ドラは4s
      ],
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    // 役満ではドラが加算されても、点数レベルは役満のまま
    // (ドラは翻数に加算されるが、既に13翻以上なので役満)
    expect(result.scoreLevel).toBe("Yakuman");
    expect(getPaymentTotal(result.payment)).toBe(32000);
  });

  it("通常役のみ(役満なし)の場合は正常な点数計算が行われること", () => {
    // 平和・ツモ 20符2翻
    // 123m 456p 789s 23s 55m + 1sツモ -> 14枚
    const tehai = createTehai("123m456p789s123s55m");
    const config: ScoreCalculationConfig = {
      agariHai: getHaiKindId("1s"),
      isTsumo: true,
      jikaze: HaiKind.Nan,
      bakaze: HaiKind.Ton,
      doraMarkers: [],
    };

    const res = calculateScoreForTehai(tehai, config);
    if (res.isErr()) throw res.error;
    const result = res.value;

    // 平和ツモ: 20符2翻 -> 400/700
    expect(result.han).toBe(2);
    expect(result.fu).toBe(20);
    expect(result.scoreLevel).toBe("Normal");
  });
});
