import { describe, it, expect } from "vitest";
import { formatMpsz } from "./mpsz-format";
import { parseExtendedMpsz } from "./mpsz";
import { HaiKind, Tacha, type Tehai } from "../../types";
import { unwrapOrThrow } from "../../utils/test-helpers";

/** 文字列を解釈して正規形に変換する */
function canonicalize(input: string): string {
  return formatMpsz(unwrapOrThrow(parseExtendedMpsz(input)));
}

describe("formatMpsz (正規形への変換)", () => {
  describe("SPEC 7.2 純手牌の正規形", () => {
    it("色ごとにまとめ、1, 2, 3, 4, 5, 0, 6, 7, 8, 9 の順に並べること", () => {
      expect(canonicalize("1m456p23m0p")).toBe("123m4506p");
    });

    it("色は m → p → s → z の順で、牌が無い色は書かないこと", () => {
      expect(canonicalize("1z9s9p9m")).toBe("9m9p9s1z");
      expect(canonicalize("")).toBe("");
    });

    it("赤 5 は 5 の直後に置くこと", () => {
      expect(canonicalize("0m5m0m5m")).toBe("5500m");
    });
  });

  describe("SPEC 7.3 面子ブロックの正規形", () => {
    it.each([
      ["[321-m]", "[1-23m]"],
      ["[55=5p]", "[5=55p]"],
      ["{5=55^5p}", "{5=5^55p}"],
      ["[550=p]", "[550=p]"],
    ])("%s → %s", (input, expected) => {
      expect(canonicalize(input)).toBe(expected);
    });

    it("注釈はそれが付いた牌と一緒に移動すること", () => {
      expect(canonicalize("[64-0m]")).toBe("[4-06m]");
      expect(canonicalize("[6-40m]")).toBe("[406-m]");
      expect(canonicalize("{0^555=p}")).toBe("{5=550^p}");
      expect(canonicalize("{0=5^55p}")).toBe("{5^550=p}");
    });

    it("牌種も赤属性も同じ牌が複数あるときは 方向注釈 → ^ → 注釈なし の順に並べること", () => {
      expect(canonicalize("{55^5=5p}")).toBe("{5=5^55p}");
      expect(canonicalize("[55+5p]")).toBe("[5+55p]");
      expect(canonicalize("(5505p)")).toBe("(5550p)");
    });
  });

  describe("SPEC 7.4 手牌全体の正規形", () => {
    it("純手牌を先頭に置き、面子ブロックを色 → 数字列 → 括弧の種類 → 文字列全体の順に並べること", () => {
      expect(canonicalize("[7+77z]456p1m23m(1111z){5=55^5p}0p")).toBe(
        "123m4506p{5=5^55p}(1111z)[7+77z]",
      );
    });

    it("数字列は 7.1 の順で辞書式に比較し、接頭辞なら短い方が先であること", () => {
      expect(canonicalize("[5=555p][5=55p]")).toBe("[5=55p][5=555p]");
      expect(canonicalize("[6-78m][1-23m][4-56m]")).toBe(
        "[1-23m][4-56m][6-78m]",
      );
      expect(canonicalize("[6-78m][40-6m][4-56m]")).toBe(
        "[4-56m][40-6m][6-78m]",
      );
    });

    it("括弧の種類は [ → { → ( の順であること", () => {
      expect(canonicalize("(5555p){5=555^p}[5=555p]")).toBe(
        "[5=555p]{5=5^55p}(5555p)",
      );
    });

    it("注釈の違いだけが残る場合はブロック文字列全体の ASCII 順であること", () => {
      expect(canonicalize("[5=55p][5-55p][5+55p]")).toBe(
        "[5+55p][5-55p][5=55p]",
      );
      expect(canonicalize("[12-3m][1-23m]")).toBe("[1-23m][12-3m]");
    });

    it("同じ面子が複数あっても 1 つにまとめないこと", () => {
      expect(canonicalize("[1-23m][1-23m]")).toBe("[1-23m][1-23m]");
    });
  });

  describe("等値比較", () => {
    it("同じ手牌を表す文字列は同じ正規形になること", () => {
      const forms = [
        "123m456p[5=55m]",
        "456p123m[5=55m]",
        "[55=5m]1m23m456p",
        "[5=55m]4p56p3m12m",
      ];
      const canonical = forms.map(canonicalize);
      expect(new Set(canonical).size).toBe(1);
    });

    it("鳴き元・鳴いた牌・赤属性が違えば正規形も違うこと", () => {
      const forms = ["[5=55m]", "[5-55m]", "[55=0m]", "[550=m]", "(5555m)"];
      const canonical = forms.map(canonicalize);
      expect(new Set(canonical).size).toBe(forms.length);
    });

    it("正規形は冪等であること（正規形を解釈して再変換しても変わらない）", () => {
      for (const input of [
        "123m789s11z[40-6p]{7=777^z}",
        "22m33p44s[5=55m][6+66p]",
        "19m19p19s1234567z(8888s)",
        "[7+77z]456p1m23m(1111z){5=55^5p}0p",
      ]) {
        const once = canonicalize(input);
        expect(canonicalize(once), input).toBe(once);
      }
    });

    it("正規形を解釈すると元の手牌と同じ構造になること", () => {
      const original = unwrapOrThrow(
        parseExtendedMpsz("[7+77z]456p1m23m(1111z){5=55^5p}0p"),
      );
      const reparsed = unwrapOrThrow(parseExtendedMpsz(formatMpsz(original)));
      expect([...reparsed.closed].sort((a, b) => a - b)).toEqual(
        [...original.closed].sort((a, b) => a - b),
      );
      expect(reparsed.exposed).toHaveLength(original.exposed.length);
      for (const mentsu of original.exposed) {
        expect(reparsed.exposed).toContainEqual(mentsu);
      }
    });
  });

  it("牌種IDの手牌（赤なし）をそのまま渡せること", () => {
    const tehai: Tehai = {
      closed: [HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.ManZu1],
      exposed: [
        {
          type: "Koutsu",
          hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
          furo: { type: "Pon", from: Tacha.Shimocha, nakiHai: HaiKind.Chun },
        },
        {
          type: "Shuntsu",
          hais: [HaiKind.SouZu4, HaiKind.SouZu5, HaiKind.SouZu6],
          furo: { type: "Chi", from: Tacha.Kamicha, nakiHai: HaiKind.SouZu6 },
        },
        {
          type: "Kantsu",
          hais: [
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
          ],
          furo: {
            type: "Kakan",
            from: Tacha.Toimen,
            nakiHai: HaiKind.ManZu5,
            kakanHai: HaiKind.ManZu5,
          },
        },
        {
          type: "Kantsu",
          hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton, HaiKind.Ton],
        },
      ],
    };
    expect(formatMpsz(tehai)).toBe("1m99p{5=5^55m}[456-s](1111z)[7+77z]");
  });
});
