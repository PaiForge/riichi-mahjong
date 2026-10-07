import { describe, it, expect } from "vitest";
import {
  parseExtendedMpsz,
  parseMpsz,
  isExtendedMpsz,
  isMpsz,
  asMpsz,
  asExtendedMpsz,
} from "./mpsz";
import { AkaHai, HaiKind, Tacha, type HaiCode, type Tehai } from "../../types";
import { MpszParseError } from "../../errors";
import { unwrapOrThrow } from "../../utils/test-helpers";

const { ManZu1, ManZu2, ManZu3, ManZu4, ManZu5, ManZu6 } = HaiKind;
const { PinZu4, PinZu5, PinZu6 } = HaiKind;
const { Ton, Chun } = HaiKind;

/**
 * SPEC 9.1 正当な例。表記と、その解釈結果（牌コードの手牌）。
 * 純手牌は表記順のまま、面子の牌は正規形の整列順。
 */
const VALID_CASES: readonly [string, Tehai<HaiCode>][] = [
  [
    "123m456p789s11z22z",
    {
      closed: [0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28],
      exposed: [],
    },
  ],
  ["", { closed: [], exposed: [] }],
  [
    "[1-23m]",
    {
      closed: [],
      exposed: [
        {
          type: "Shuntsu",
          hais: [ManZu1, ManZu2, ManZu3],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: ManZu1 },
        },
      ],
    },
  ],
  [
    "[12-3m]",
    {
      closed: [],
      exposed: [
        {
          type: "Shuntsu",
          hais: [ManZu1, ManZu2, ManZu3],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: ManZu2 },
        },
      ],
    },
  ],
  [
    "[40-6m]",
    {
      closed: [],
      exposed: [
        {
          type: "Shuntsu",
          hais: [ManZu4, AkaHai.ManZu5, ManZu6],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: AkaHai.ManZu5 },
        },
      ],
    },
  ],
  [
    "[5=55p]",
    {
      closed: [],
      exposed: [
        {
          type: "Koutsu",
          hais: [PinZu5, PinZu5, PinZu5],
          furo: { type: "Pon", from: Tacha.Toimen, nakiHai: PinZu5 },
        },
      ],
    },
  ],
  [
    "[5-55p]",
    {
      closed: [],
      exposed: [
        {
          type: "Koutsu",
          hais: [PinZu5, PinZu5, PinZu5],
          furo: { type: "Pon", from: Tacha.Kamicha, nakiHai: PinZu5 },
        },
      ],
    },
  ],
  [
    "[550=p]",
    {
      closed: [],
      exposed: [
        {
          type: "Koutsu",
          hais: [PinZu5, PinZu5, AkaHai.PinZu5],
          furo: { type: "Pon", from: Tacha.Toimen, nakiHai: AkaHai.PinZu5 },
        },
      ],
    },
  ],
  [
    "[7+77z]",
    {
      closed: [],
      exposed: [
        {
          type: "Koutsu",
          hais: [Chun, Chun, Chun],
          furo: { type: "Pon", from: Tacha.Shimocha, nakiHai: Chun },
        },
      ],
    },
  ],
  [
    "[5+555p]",
    {
      closed: [],
      exposed: [
        {
          type: "Kantsu",
          hais: [PinZu5, PinZu5, PinZu5, PinZu5],
          furo: { type: "Daiminkan", from: Tacha.Shimocha, nakiHai: PinZu5 },
        },
      ],
    },
  ],
  [
    "[0=555p]",
    {
      closed: [],
      exposed: [
        {
          type: "Kantsu",
          hais: [PinZu5, PinZu5, PinZu5, AkaHai.PinZu5],
          furo: {
            type: "Daiminkan",
            from: Tacha.Toimen,
            nakiHai: AkaHai.PinZu5,
          },
        },
      ],
    },
  ],
  [
    "{5=555^p}",
    {
      closed: [],
      exposed: [
        {
          type: "Kantsu",
          hais: [PinZu5, PinZu5, PinZu5, PinZu5],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: PinZu5,
            kakanHai: PinZu5,
          },
        },
      ],
    },
  ],
  [
    "{5=550^p}",
    {
      closed: [],
      exposed: [
        {
          type: "Kantsu",
          hais: [PinZu5, PinZu5, PinZu5, AkaHai.PinZu5],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: PinZu5,
            kakanHai: AkaHai.PinZu5,
          },
        },
      ],
    },
  ],
  [
    "{0=555^p}",
    {
      closed: [],
      exposed: [
        {
          type: "Kantsu",
          hais: [PinZu5, PinZu5, PinZu5, AkaHai.PinZu5],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: AkaHai.PinZu5,
            kakanHai: PinZu5,
          },
        },
      ],
    },
  ],
  [
    "(1111z)",
    {
      closed: [],
      exposed: [{ type: "Kantsu", hais: [Ton, Ton, Ton, Ton] }],
    },
  ],
  [
    "(5550p)",
    {
      closed: [],
      exposed: [
        { type: "Kantsu", hais: [PinZu5, PinZu5, PinZu5, AkaHai.PinZu5] },
      ],
    },
  ],
  [
    "123m405p789s11z",
    {
      closed: [0, 1, 2, 12, AkaHai.PinZu5, 13, 24, 25, 26, 27, 27],
      exposed: [],
    },
  ],
  [
    "22m33p44s[5=55m][6+66p]",
    {
      closed: [1, 1, 11, 11, 21, 21],
      exposed: [
        {
          type: "Koutsu",
          hais: [ManZu5, ManZu5, ManZu5],
          furo: { type: "Pon", from: Tacha.Toimen, nakiHai: ManZu5 },
        },
        {
          type: "Koutsu",
          hais: [PinZu6, PinZu6, PinZu6],
          furo: { type: "Pon", from: Tacha.Shimocha, nakiHai: PinZu6 },
        },
      ],
    },
  ],
  [
    "19m19p19s1234567z(8888s)",
    {
      closed: [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33],
      exposed: [{ type: "Kantsu", hais: [25, 25, 25, 25] }],
    },
  ],
  [
    "123m789s11z[40-6p]{7=777^z}",
    {
      closed: [0, 1, 2, 24, 25, 26, 27, 27],
      exposed: [
        {
          type: "Shuntsu",
          hais: [PinZu4, AkaHai.PinZu5, PinZu6],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: AkaHai.PinZu5 },
        },
        {
          type: "Kantsu",
          hais: [Chun, Chun, Chun, Chun],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: Chun,
            kakanHai: Chun,
          },
        },
      ],
    },
  ],
];

/** SPEC 9.2 不正な例。表記と理由。 */
const INVALID_CASES: readonly [string, string][] = [
  ["[123m]", "副露に方向注釈がない"],
  ["[555p]", "副露に方向注釈がない"],
  ["{5555p}", "加槓に方向注釈と ^ がない"],
  ["{5=555p}", "加槓に ^ がない"],
  ["{5^555p}", "加槓に方向注釈がない"],
  ["{5=^555p}", "1 つの牌に注釈が 2 つ"],
  ["[1=23m]", "チーの鳴き元が上家でない"],
  ["[1-23z]", "字牌に順子はない"],
  ["[1-24m]", "連続していない"],
  ["[5=5p]", "2 枚の面子はない"],
  ["[5=55^p]", "副露に ^ は書けない"],
  ["[5=5-5p]", "方向注釈が 2 つ"],
  ["(5=555p)", "暗槓に注釈は書けない"],
  ["(555p)", "暗槓は 4 枚"],
  ["[1m2m3m]", "ブロック内にサフィックスが複数ある"],
  ["1[2=22p]23m", "括弧をまたぐ数字列"],
  ["1-23m", "純手牌に注釈"],
  ["0z", "字牌の数字範囲外"],
  ["8z", "字牌の数字範囲外"],
  ["9z", "字牌の数字範囲外"],
  ["[(1111z)]", "入れ子"],
  ["[1-23m", "括弧が閉じていない"],
  ["123M", "大文字"],
  ["123m 456p", "空白"],
];

describe("parseExtendedMpsz (Extended MPSZ 2.0 の解析)", () => {
  describe("SPEC 9.1 正当な例", () => {
    it.each(VALID_CASES)("%j を解釈できること", (input, expected) => {
      const result = parseExtendedMpsz(input);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(expected);
      }
    });
  });

  describe("SPEC 9.2 不正な例", () => {
    it.each(INVALID_CASES)(
      "%j は全体を不正として拒否すること（%s）",
      (input) => {
        const result = parseExtendedMpsz(input);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(MpszParseError);
        }
      },
    );

    it("不正な牌を読み飛ばして残りを解釈しないこと", () => {
      // 0z を含む文字列は、他の部分が正当でも全体を拒否する
      expect(parseExtendedMpsz("123m0z").isErr()).toBe(true);
      expect(parseExtendedMpsz("123m[1-23z]456p").isErr()).toBe(true);
      // 字牌の順子・5 枚の副露・2 枚の面子
      expect(parseExtendedMpsz("[11111-m]").isErr()).toBe(true);
      expect(parseExtendedMpsz("[5=5p]123m").isErr()).toBe(true);
    });

    it("字句に無い文字・対応しない閉じ括弧を拒否すること", () => {
      for (const input of [
        "123m!",
        "1!23m",
        "123m]",
        "123m)",
        "[1-23m)",
        "123m\n",
      ]) {
        expect(parseExtendedMpsz(input).isErr(), input).toBe(true);
      }
    });
  });

  describe("赤 5 の扱い", () => {
    it("純手牌の 0 は赤 5 の牌コードとして保持すること", () => {
      const tehai = unwrapOrThrow(parseExtendedMpsz("0m05p0s"));
      expect(tehai.closed).toEqual([
        AkaHai.ManZu5,
        AkaHai.PinZu5,
        HaiKind.PinZu5,
        AkaHai.SouZu5,
      ]);
    });

    it("面子の判定では 0 と 5 を同一視すること", () => {
      // 順子・刻子・槓子のいずれも成立する
      expect(parseExtendedMpsz("[0-46m]").isOk()).toBe(true);
      expect(parseExtendedMpsz("[00=5p]").isOk()).toBe(true);
      expect(parseExtendedMpsz("(0000s)").isOk()).toBe(true);
      expect(parseExtendedMpsz("{0=00^0s}").isOk()).toBe(true);
    });
  });

  describe("並び順", () => {
    it("純手牌は表記順のまま返すこと（並び順に意味はない）", () => {
      const tehai = unwrapOrThrow(parseExtendedMpsz("456p1m23m"));
      expect(tehai.closed).toEqual([12, 13, 14, 0, 1, 2]);
    });

    it("面子の牌は正規形の整列順に並べ、注釈は付いた牌に属すること", () => {
      const tehai = unwrapOrThrow(parseExtendedMpsz("[321-m]"));
      expect(tehai.exposed[0]).toEqual({
        type: "Shuntsu",
        hais: [ManZu1, ManZu2, ManZu3],
        furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: ManZu1 },
      });
    });

    it("面子ブロックと純手牌の前後関係に意味がないこと", () => {
      const a = unwrapOrThrow(parseExtendedMpsz("[5=55p]123m"));
      const b = unwrapOrThrow(parseExtendedMpsz("123m[5=55p]"));
      expect(a).toEqual(b);
    });
  });

  it("面子ブロックを含まない文字列も受理すること", () => {
    const tehai = unwrapOrThrow(parseExtendedMpsz("123m"));
    expect(tehai).toEqual({ closed: [0, 1, 2], exposed: [] });
  });
});

describe("parseMpsz (標準 MPSZ の解析)", () => {
  it("純手牌だけの文字列を解釈できること", () => {
    expect(unwrapOrThrow(parseMpsz("123m405p"))).toEqual({
      closed: [0, 1, 2, 12, AkaHai.PinZu5, 13],
      exposed: [],
    });
    expect(unwrapOrThrow(parseMpsz(""))).toEqual({ closed: [], exposed: [] });
  });

  it("面子ブロックを含む文字列は不正として扱うこと", () => {
    for (const input of ["[1-23m]", "123m(1111z)", "{5=555^p}"]) {
      const result = parseMpsz(input);
      expect(result.isErr(), input).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(MpszParseError);
      }
    }
  });

  it("字句・数字範囲の検証は parseExtendedMpsz と同じであること", () => {
    for (const input of [
      "0z",
      "8z",
      "123M",
      "123m 456p",
      "1-23m",
      "abc",
      "123",
    ]) {
      expect(parseMpsz(input).isErr(), input).toBe(true);
    }
  });
});

describe("isMpsz / isExtendedMpsz (型ガード)", () => {
  it("isMpsz は面子ブロックを含まない正当な文字列で true になること", () => {
    expect(isMpsz("123m456p")).toBe(true);
    expect(isMpsz("123m405p")).toBe(true);
    expect(isMpsz("")).toBe(true);
  });

  it("isMpsz は面子ブロックを含む文字列・不正な文字列で false になること", () => {
    for (const input of [
      "[1-23m]",
      "(1111z)",
      "0z",
      "123M",
      "abc",
      "123",
      "m",
      "123m456",
    ]) {
      expect(isMpsz(input), input).toBe(false);
    }
  });

  it("isExtendedMpsz は面子ブロックを 1 つ以上含む正当な文字列で true になること", () => {
    expect(isExtendedMpsz("[1-23m]")).toBe(true);
    expect(isExtendedMpsz("(1111z)")).toBe(true);
    expect(isExtendedMpsz("123m[4-56p]{7=777^z}")).toBe(true);
  });

  it("isExtendedMpsz は面子ブロックを含まない文字列で false になること（標準 MPSZ と区別する）", () => {
    expect(isExtendedMpsz("123m456p")).toBe(false);
    expect(isExtendedMpsz("")).toBe(false);
  });

  it("isExtendedMpsz は不正な文字列で false になること", () => {
    for (const [input] of INVALID_CASES) {
      expect(isExtendedMpsz(input), input).toBe(false);
    }
  });
});

describe("asMpsz / asExtendedMpsz (スマートコンストラクタ)", () => {
  it("正当な文字列を Ok で返すこと", () => {
    const std = asMpsz("123m");
    expect(std.isOk() && std.value).toBe("123m");
    const ext = asExtendedMpsz("[1-23m]");
    expect(ext.isOk() && ext.value).toBe("[1-23m]");
  });

  it("不正な文字列を Err で返すこと", () => {
    expect(asMpsz("[1-23m]").isErr()).toBe(true);
    expect(asExtendedMpsz("123m").isErr()).toBe(true);
    expect(asExtendedMpsz("[123m]").isErr()).toBe(true);
  });
});
