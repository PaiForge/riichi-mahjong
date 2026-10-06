import { describe, it, expect } from "vitest";
import {
  calculateScore,
  calculateScoreFromHanAndFu,
  calculateBasePoints,
  getPaymentTotal,
  getYakumanMultiplier,
} from "./index";
import type { FuResult } from "./lib/fu/types";
import type { HouraContext } from "../yaku/types";
import { type Fu, HaiKind } from "../../types";
import { calculateScoreForTehai, rankScoresForTehai } from "./index";
import { detectYaku } from "../yaku";
import {
  createHouraContext,
  createScoreCalculationConfig,
  createTehai,
  getHaiKindId,
  unwrapOrThrow,
} from "../../utils/test-helpers";

/**
 * 符の内訳に依存しない点数計算のテスト用に、合計符だけを指定した FuResult を作る。
 */
const mockFuResult = (fu: Fu): FuResult => ({
  total: fu,
  details: { base: 20, mentsu: 0, jantou: 0, machi: 0, agari: 0 },
});

/**
 * 点数計算用のコンテキストを作る。支払いの倍率に効く isOya / isTsumo のみを
 * 指定し、それ以外は役判定用の既定値を用いる。
 */
const mockContext = (
  isOya: boolean,
  isTsumo: boolean,
): HouraContext & { isOya: boolean } => ({
  ...createHouraContext({ isTsumo }),
  isOya,
});

describe("calculateScoreFromHanAndFu", () => {
  describe("基本ケース (Normal)", () => {
    it("子 30符 1翻 ロン -> 1000点", () => {
      // Base: 30 * 2^(2+1) = 30 * 8 = 240
      // Ron: 240 * 4 = 960 -> 1000
      const score = calculateScoreFromHanAndFu(
        1,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(score.payment.type).toBe("ron");
      expect(getPaymentTotal(score.payment)).toBe(1000);
    });

    it("子 30符 4翻 ロン -> 7700点", () => {
      // Base: 30 * 2^6 = 30 * 64 = 1920
      // Ron: 1920 * 4 = 7680 -> 7700
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(score.payment.type).toBe("ron");
      expect(getPaymentTotal(score.payment)).toBe(7700);
    });

    it("親 30符 4翻 ロン -> 11600点", () => {
      // Base: 1920
      // Ron: 1920 * 6 = 11520 -> 11600
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(true, false),
      );
      expect(score.payment.type).toBe("ron");
      expect(getPaymentTotal(score.payment)).toBe(11600);
    });

    it("子 20符 2翻 ツモ (平和ツモ) -> 400/700 (1500点)", () => {
      // Base: 20 * 2^4 = 320
      // Oya pays: 320 * 2 = 640 -> 700
      // Ko pays: 320 * 1 = 320 -> 400
      // Total from 3 players.
      // Oya pay: 700.
      // Ko pay: 400.
      // Total: 700 + 400*2 = 1500.
      const score = calculateScoreFromHanAndFu(
        2,
        mockFuResult(20),
        0,
        mockContext(false, true),
      );
      expect(score.payment.type).toBe("koTsumo");
      if (score.payment.type === "koTsumo") {
        expect(score.payment.amount).toEqual([400, 700]);
      }
      expect(getPaymentTotal(score.payment)).toBe(1500);
    });
  });

  describe("満貫以上 (Limits)", () => {
    it("子 5翻 (満貫) -> 8000点", () => {
      // 30符5翻 -> Mangan
      const score = calculateScoreFromHanAndFu(
        5,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
    });

    it("子 70符 3翻 (満貫切り上げ) -> 8000点", () => {
      // Base: 70 * 2^5 = 70 * 32 = 2240
      // 2240 >= 2000 -> Mangan
      const score = calculateScoreFromHanAndFu(
        3,
        mockFuResult(70),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
    });

    it("親 6翻 (跳満) -> 18000点", () => {
      const score = calculateScoreFromHanAndFu(
        6,
        mockFuResult(30),
        0,
        mockContext(true, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(18000);
    });

    it("子 13翻 (数え役満) -> 32000点", () => {
      const score = calculateScoreFromHanAndFu(
        13,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 26翻 (数え) -> 役満止まりで32000点", () => {
      // 役満役なしの26翻（リーチ+裏+ドラ大量等）はダブル役満にならない
      const score = calculateScoreFromHanAndFu(
        26,
        mockFuResult(30),
        0,
        mockContext(false, false),
      );
      expect(score.scoreLevel).toBe("Yakuman");
      expect(score.yakumanMultiplier).toBe(0);
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 役満単位1 -> 32000点", () => {
      const score = calculateScoreFromHanAndFu(
        13,
        mockFuResult(30),
        0,
        mockContext(false, false),
        1,
      );
      expect(score.scoreLevel).toBe("Yakuman");
      expect(score.yakumanMultiplier).toBe(1);
      expect(getPaymentTotal(score.payment)).toBe(32000);
    });

    it("子 役満単位2 (ダブル役満) -> 64000点", () => {
      const score = calculateScoreFromHanAndFu(
        26,
        mockFuResult(30),
        0,
        mockContext(false, false),
        2,
      );
      expect(score.scoreLevel).toBe("DoubleYakuman");
      expect(score.yakumanMultiplier).toBe(2);
      expect(getPaymentTotal(score.payment)).toBe(64000);
    });

    it("子 役満単位3 (トリプル役満) -> 96000点", () => {
      // 例: 大四喜ダブル + 字一色を複合合算した場合
      const score = calculateScoreFromHanAndFu(
        39,
        mockFuResult(30),
        0,
        mockContext(false, false),
        3,
      );
      expect(score.scoreLevel).toBe("DoubleYakuman");
      expect(score.yakumanMultiplier).toBe(3);
      expect(getPaymentTotal(score.payment)).toBe(96000);
    });
  });
});

describe("getYakumanMultiplier", () => {
  it("役満役がなければ 0（数え役満相当の翻数でも 0）", () => {
    expect(getYakumanMultiplier([])).toBe(0);
    expect(
      getYakumanMultiplier([
        ["Chinitsu", 6],
        ["Ryanpeikou", 3],
      ]),
    ).toBe(0);
  });

  it("役満1つなら 1", () => {
    expect(getYakumanMultiplier([["Suuankou", 13]])).toBe(1);
  });

  it("ダブル役満の形（26翻の役）は単体で 2", () => {
    expect(getYakumanMultiplier([["Suuankou", 26]])).toBe(2);
  });

  it("複合の合算なし（既定）: 複数役満は最高位1つ分", () => {
    expect(
      getYakumanMultiplier([
        ["Daisangen", 13],
        ["Tsuuiisou", 13],
      ]),
    ).toBe(1);
    // 単体で成立しているダブル役満は合算なしでも減らない
    expect(
      getYakumanMultiplier([
        ["Suuankou", 26],
        ["Tsuuiisou", 13],
      ]),
    ).toBe(2);
  });

  it("複合の合算あり: 役満単位の合計", () => {
    expect(
      getYakumanMultiplier(
        [
          ["Daisangen", 13],
          ["Tsuuiisou", 13],
        ],
        { fukugouYakuman: true },
      ),
    ).toBe(2);
    // ダブル役満の形 + 役満 = トリプル
    expect(
      getYakumanMultiplier(
        [
          ["Suuankou", 26],
          ["Tsuuiisou", 13],
        ],
        { fukugouYakuman: true },
      ),
    ).toBe(3);
  });
});

describe("calculateBasePoints", () => {
  describe("30符", () => {
    it("30符 2翻 -> 480", () => {
      // 30 * 2^(2+2) = 30 * 16 = 480
      expect(calculateBasePoints(30, 2)).toBe(480);
    });

    it("30符 3翻 -> 960", () => {
      // 30 * 2^(2+3) = 30 * 32 = 960
      expect(calculateBasePoints(30, 3)).toBe(960);
    });
  });

  describe("40符", () => {
    it("40符 2翻 -> 640", () => {
      // 40 * 2^(2+2) = 40 * 16 = 640
      expect(calculateBasePoints(40, 2)).toBe(640);
    });

    it("40符 3翻 -> 1280", () => {
      // 40 * 2^(2+3) = 40 * 32 = 1280
      expect(calculateBasePoints(40, 3)).toBe(1280);
    });
  });
});

describe("切り上げ満貫 (kiriageMangan)", () => {
  const KIRIAGE = { kiriageMangan: true } as const;

  describe("基本点1920（30符4翻・60符3翻）を満貫に切り上げること", () => {
    it("子ロン 30符4翻: 7700 -> 8000", () => {
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(false, false),
        0,
        KIRIAGE,
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
      expect(score.scoreLevel).toBe("Mangan");
    });

    it("親ロン 30符4翻: 11600 -> 12000", () => {
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(true, false),
        0,
        KIRIAGE,
      );
      expect(getPaymentTotal(score.payment)).toBe(12000);
    });

    it("子ツモ 30符4翻: 2000/3900 -> 2000/4000", () => {
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(false, true),
        0,
        KIRIAGE,
      );
      expect(score.payment).toEqual({ type: "koTsumo", amount: [2000, 4000] });
    });

    it("親ツモ 30符4翻: 3900オール -> 4000オール", () => {
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(true, true),
        0,
        KIRIAGE,
      );
      expect(score.payment).toEqual({ type: "oyaTsumo", amount: 4000 });
    });

    it("子ロン 60符3翻: 7700 -> 8000", () => {
      const score = calculateScoreFromHanAndFu(
        3,
        mockFuResult(60),
        0,
        mockContext(false, false),
        0,
        KIRIAGE,
      );
      expect(getPaymentTotal(score.payment)).toBe(8000);
    });

    it("翻数と符は切り上げても変わらないこと", () => {
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(30),
        0,
        mockContext(false, false),
        0,
        KIRIAGE,
      );
      expect(score.han).toBe(4);
      expect(score.fu).toBe(30);
    });
  });

  describe("基本点1920に満たない手は切り上げないこと", () => {
    it("子ロン 25符4翻 (基本点1600) は 6400 のまま", () => {
      const score = calculateScoreFromHanAndFu(
        4,
        mockFuResult(25),
        0,
        mockContext(false, false),
        0,
        KIRIAGE,
      );
      expect(getPaymentTotal(score.payment)).toBe(6400);
      expect(score.scoreLevel).toBe("Normal");
    });

    it("子ロン 40符3翻 (基本点1280) は 5200 のまま", () => {
      const score = calculateScoreFromHanAndFu(
        3,
        mockFuResult(40),
        0,
        mockContext(false, false),
        0,
        KIRIAGE,
      );
      expect(getPaymentTotal(score.payment)).toBe(5200);
    });
  });

  it("既定（ルール未指定）では切り上げないこと", () => {
    const score = calculateScoreFromHanAndFu(
      4,
      mockFuResult(30),
      0,
      mockContext(false, false),
    );
    expect(getPaymentTotal(score.payment)).toBe(7700);
    expect(score.scoreLevel).toBe("Normal");
  });
});

describe("手牌からの点数計算 (calculateScoreForTehai) - 切り上げ満貫", () => {
  // 223344m 567p 678s + 55p ロン(4m)、ドラ表示牌 6p（ドラ 7p が1枚）
  // 断么 + 平和 + 一盃口 + ドラ1 = 4翻30符
  const tehai = createTehai("223344m567p678s55p");
  const config = {
    agariHai: getHaiKindId("4m"),
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    isTsumo: false,
    doraMarkers: [getHaiKindId("6p")],
  } as const;

  it("既定では 4翻30符 7700点となること", () => {
    const result = unwrapOrThrow(calculateScoreForTehai(tehai, config));

    expect(result.han).toBe(4);
    expect(result.fu).toBe(30);
    expect(result.scoreLevel).toBe("Normal");
    expect(getPaymentTotal(result.payment)).toBe(7700);
  });

  it("切り上げ満貫が有効なら翻・符はそのままで満貫の支払いになること", () => {
    const result = unwrapOrThrow(
      calculateScoreForTehai(tehai, {
        ...config,
        ruleConfig: { kiriageMangan: true },
      }),
    );

    expect(result.han).toBe(4);
    expect(result.fu).toBe(30);
    expect(result.scoreLevel).toBe("Mangan");
    expect(getPaymentTotal(result.payment)).toBe(8000);
  });
});

describe("翻数と符からの点数計算 (calculateScore)", () => {
  it("子ロン 30符4翻 -> 7700点", () => {
    const score = calculateScore(4, 30, { isOya: false, isTsumo: false });

    expect(score.han).toBe(4);
    expect(score.fu).toBe(30);
    expect(score.scoreLevel).toBe("Normal");
    expect(getPaymentTotal(score.payment)).toBe(7700);
  });

  it("親ロン 40符3翻 -> 7700点", () => {
    const score = calculateScore(3, 40, { isOya: true, isTsumo: false });

    expect(score.payment).toEqual({ type: "ron", amount: 7700 });
  });

  it("子ツモ 20符4翻 -> 1300/2600", () => {
    const score = calculateScore(4, 20, { isOya: false, isTsumo: true });

    expect(score.payment).toEqual({ type: "koTsumo", amount: [1300, 2600] });
  });

  it("親ツモ 30符3翻 -> 2000オール", () => {
    const score = calculateScore(3, 30, { isOya: true, isTsumo: true });

    expect(score.payment).toEqual({ type: "oyaTsumo", amount: 2000 });
  });

  it("5翻は符によらず満貫になること", () => {
    const score = calculateScore(5, 30, { isOya: false, isTsumo: false });

    expect(score.scoreLevel).toBe("Mangan");
    expect(getPaymentTotal(score.payment)).toBe(8000);
  });

  it("13翻は数え役満になること（役満単位は 0 のまま）", () => {
    const score = calculateScore(13, 30, { isOya: false, isTsumo: false });

    expect(score.scoreLevel).toBe("Yakuman");
    expect(score.yakumanMultiplier).toBe(0);
    expect(getPaymentTotal(score.payment)).toBe(32000);
  });

  it("役満単位を渡すと翻数・符によらず役満単位分の支払いになること", () => {
    const score = calculateScore(13, 40, {
      isOya: false,
      isTsumo: false,
      yakumanMultiplier: 2,
    });

    expect(score.scoreLevel).toBe("DoubleYakuman");
    expect(getPaymentTotal(score.payment)).toBe(64000);
  });

  it("ルール設定（切り上げ満貫）が反映されること", () => {
    const score = calculateScore(4, 30, {
      isOya: false,
      isTsumo: false,
      ruleConfig: { kiriageMangan: true },
    });

    expect(score.scoreLevel).toBe("Mangan");
    expect(getPaymentTotal(score.payment)).toBe(8000);
  });
});

describe("手牌からの点数計算 (calculateScoreForTehai) - 風牌の役牌", () => {
  // 東場・南家: 111z（東 = 場風）234m 456p 789s 11p、4m ロン
  const tehai = createTehai("111z234m456p789s11p");
  const agariHai = getHaiKindId("4m");

  it("場風の刻子だけの手が役ありとして計算できること", () => {
    const result = calculateScoreForTehai(tehai, {
      agariHai,
      isTsumo: false,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      doraMarkers: [],
    });
    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;

    // 副底20 + 門前ロン10 + 么九牌の暗刻8 = 38 -> 40符
    expect(result.value.detail.yakuResult).toEqual([["Bakaze", 1]]);
    expect(result.value.han).toBe(1);
    expect(result.value.fu).toBe(40);
    expect(getPaymentTotal(result.value.payment)).toBe(1300);
  });

  it("連風牌の刻子は2翻として点数に反映されること", () => {
    // 東場・東家（親）
    const result = calculateScoreForTehai(tehai, {
      agariHai,
      isTsumo: false,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Ton,
      doraMarkers: [],
    });
    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;

    expect(result.value.detail.yakuResult).toEqual([
      ["Bakaze", 1],
      ["Jikaze", 1],
    ]);
    expect(result.value.han).toBe(2);
    expect(result.value.fu).toBe(40);
    // 親ロン 40符2翻: 40 * 2^4 * 6 = 3840 -> 3900
    expect(getPaymentTotal(result.value.payment)).toBe(3900);
  });

  it("客風牌の刻子だけの手は役なし（NoYakuError）のままであること", () => {
    // 東場・南家で 333z（西）
    const result = calculateScoreForTehai(createTehai("333z234m456p789s11p"), {
      agariHai,
      isTsumo: false,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      doraMarkers: [],
    });
    expect(result.isErr()).toBe(true);
  });
});

describe("和了解釈ごとの点数の一覧 (rankScoresForTehai)", () => {
  const configFor = (agari: string, isTsumo = false) =>
    createScoreCalculationConfig({ agariHai: getHaiKindId(agari), isTsumo });

  it("高点法の降順に並び、下位の有役な解釈も残ること", () => {
    // 345m 345m 55m 123s 456s ロン(5m)
    //   5m を 345m に入れる: 平和 + 一盃口 2翻30符 2000点
    //   5m を 55m に入れる:  一盃口のみ 1翻40符 1300点
    const results = rankScoresForTehai(
      createTehai("33445555m123456s"),
      configFor("5m"),
    );

    expect(results.map((r) => [r.han, r.fu, r.payment])).toEqual([
      [2, 30, { type: "ron", amount: 2000 }],
      [1, 40, { type: "ron", amount: 1300 }],
    ]);
    expect(results.map((r) => r.detail.machiType)).toEqual([
      "Ryanmen",
      "Tanki",
    ]);
    expect(results.map((r) => r.detail.structure.type)).toEqual([
      "Mentsu",
      "Mentsu",
    ]);
  });

  it("同じ面子への置き場所は 1 つにまとめ、同じ要素を重ねて返さないこと", () => {
    // 345m 345m のどちらに 5m を入れても同じ和了形なので、両面の解釈は 1 つ
    const results = rankScoresForTehai(
      createTehai("33445555m123456s"),
      configFor("5m"),
    );

    expect(results).toHaveLength(2);
  });

  it("役が成立しない解釈は含めないこと", () => {
    // 111m 123m 999p 555s 66z ロン(1m)
    //   1m を 123m に入れる: 三暗刻
    //   1m を 111m に入れる: 明刻になり暗刻 2 つで役なし -> 含めない
    const results = rankScoresForTehai(
      createTehai("111123m999p555s66z"),
      configFor("1m"),
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.detail.yakuResult).toEqual([["Sanankou", 2]]);
  });

  it("面子手と七対子の両方に取れる手は両方を返すこと", () => {
    // 112233445566m77p ロン(3m)
    //   123m 123m 456m 456m 77p: 二盃口 3翻40符 (3m は 123m の辺張)
    //   七対子: 2翻25符
    const results = rankScoresForTehai(
      createTehai("112233445566m77p"),
      configFor("3m"),
    );

    expect(
      results.map((r) => [r.detail.structure.type, r.detail.yakuResult]),
    ).toEqual([
      ["Mentsu", [["Ryanpeikou", 3]]],
      ["Chiitoitsu", [["Chiitoitsu", 2]]],
    ]);
  });

  it("役・符・点数が同じでも置き場所が違う解釈は別の要素として残し、列挙順を保つこと", () => {
    // 111m 123m 999p 555s 66z ツモ(1m): ツモなので 111m はどちらでも暗刻
    //   1m を 111m に入れる: 双碰 / 1m を 123m に入れる: 両面
    //   いずれも 三暗刻 + 門前清自摸和 3翻50符で同点
    const results = rankScoresForTehai(
      createTehai("111123m999p555s66z"),
      configFor("1m", true),
    );

    expect(results.map((r) => [r.han, r.fu])).toEqual([
      [3, 50],
      [3, 50],
    ]);
    expect(results.map((r) => r.detail.machiType)).toEqual([
      "Shanpon",
      "Ryanmen",
    ]);
  });

  it("成立する和了が無ければ空配列を返すこと", () => {
    const results = rankScoresForTehai(
      createTehai("234m234p456s678s55z"),
      configFor("4m"),
    );

    expect(results).toEqual([]);
  });

  it("先頭が calculateScoreForTehai の結果と一致し、役が detectYaku と一致すること", () => {
    const tehai = createTehai("33445555m123456s");
    const config = configFor("5m");

    const [first] = rankScoresForTehai(tehai, config);
    const best = unwrapOrThrow(calculateScoreForTehai(tehai, config));

    expect(first).toEqual(best);
    expect(first?.detail.yakuResult).toEqual(detectYaku(tehai, config));
  });
});
