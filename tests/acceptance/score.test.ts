import { beforeAll, describe, expect, it } from "vitest";
import {
  calculateScoreForTehai,
  getPaymentTotal,
  type ScoreCalculationConfig,
} from "../../src/features/score";
import { createTehai, unwrapOrThrow } from "../../src/utils/test-helpers";
import { HaiKind, type HaiKindId } from "../../src/types";
import {
  ensureVerifierImage,
  runReferenceVerifier,
} from "./reference-verifier";

// 現状は門前手のみテストするため、mspz文字列 (例: "123m456p...") で十分です。
// createTehai の mspz 形式は mahjong ライブラリの one_line_string_to_136_array ("123m") と互換性があります。

// ============================================================================
// テストケース定義
// ============================================================================
// 各ケースの `expected` は本ライブラリが返すべき飜数・符・支払い合計です。
// 期待値との一致 (Primary) と、参照実装 (Python mahjong) の結果との一致 (Secondary) の
// 両方を検証します。参照実装は手牌 13 枚 (`tehai`) + 和了牌 (`agariStr`) を受け取ります。
interface ScoreCase {
  description: string;
  /** 和了牌を除く 13 枚 (MSPZ) */
  tehai: string;
  agariHai: HaiKindId;
  agariStr: string;
  doraMarkers: HaiKindId[];
  doraStr: string[];
  isTsumo: boolean;
  isOya: boolean;
  expected: {
    han: number;
    fu: number;
    /** 支払い合計 (ツモは全員分の合計、ロンは放銃者の支払い) */
    total: number;
  };
}

const CASES: ScoreCase[] = [
  {
    description: "子 門前 平和・ツモ・ドラ1 3飜20符",
    tehai: "234m456m789m23p99s", // 13枚
    agariHai: HaiKind.PinZu4,
    agariStr: "4p",
    doraMarkers: [HaiKind.ManZu1],
    doraStr: ["1m"],
    isTsumo: true,
    isOya: false,
    // 子ツモ 3飜20符: 700/1300
    expected: { han: 3, fu: 20, total: 2700 },
  },
  {
    description: "子 門前 断幺九・ロン 1飜40符",
    tehai: "234m456m678m234p3s", // 789mではなく678m
    agariHai: HaiKind.SouZu3,
    agariStr: "3s",
    doraMarkers: [HaiKind.SouZu9],
    doraStr: ["9s"],
    isTsumo: false,
    isOya: false,
    // 備考: 234m 456m 678m 234p 3s単騎待ち -> 40符
    expected: { han: 1, fu: 40, total: 1300 },
  },
  {
    description: "子 門前 七対子・混老頭・ツモ 5飜25符",
    tehai: "11m99m11p99p11s99s5z", // 13枚. 5z単騎.
    agariHai: HaiKind.Haku, // 5z
    agariStr: "5z",
    doraMarkers: [HaiKind.PinZu1],
    doraStr: ["1p"],
    isTsumo: true,
    isOya: false,
    // 子ツモ 満貫: 2000/4000
    expected: { han: 5, fu: 25, total: 8000 },
  },
  {
    description: "親 門前 役牌・ロン 1飜40符",
    tehai: "123m456p789s11p55z", // 13枚. 55z対子で5z待ち（刻子にするため）。
    // 123m, 456p, 789s, 11p(雀頭), 55z(待ち)。
    // 5zで和了 -> 555z。
    // 20(副底) + 10(面前ロン) + 2(役牌雀頭) -> 32 -> 40符
    agariHai: HaiKind.Haku, // 5z
    agariStr: "5z",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: true,
    expected: { han: 1, fu: 40, total: 2000 },
  },
  {
    description: "親 門前 場風・自風（連風牌 東）・ロン 2飜40符",
    tehai: "111z234m456p789s1p", // 13枚. 1p単騎.
    // 東場・東家なので 111z は場風1翻 + 自風1翻。
    // 20(副底) + 10(門前ロン) + 8(么九牌の暗刻) + 2(単騎) -> 40 -> 40符
    agariHai: HaiKind.PinZu1,
    agariStr: "1p",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: true,
    expected: { han: 2, fu: 40, total: 3900 },
  },
  {
    description: "子 門前 自風（南）・ツモ 2飜40符",
    tehai: "222z234m456p789s1p", // 13枚. 1p単騎.
    // 東場・南家なので 222z は自風1翻。門前ツモで門前清自摸和1翻。
    // 20(副底) + 8(么九牌の暗刻) + 2(単騎) + 2(ツモ) -> 32 -> 40符
    agariHai: HaiKind.PinZu1,
    agariStr: "1p",
    doraMarkers: [],
    doraStr: [],
    isTsumo: true,
    isOya: false,
    // 子ツモ 2飜40符: 700/1300
    expected: { han: 2, fu: 40, total: 2700 },
  },
  {
    description: "子 門前 客風牌（西）は役牌にならず 平和・ロン 1飜30符",
    tehai: "33z234m456p789s23s", // 13枚. 33z雀頭（西は東場・南家では客風）
    // 客風牌の雀頭は役牌ではないので平和が成立し、雀頭符も付かない。
    // 20(副底) + 10(門前ロン) -> 30符
    agariHai: HaiKind.SouZu1,
    agariStr: "1s",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: false,
    expected: { han: 1, fu: 30, total: 1000 },
  },
  // --------------------------------------------------------------------------
  // 和了牌の置き場所が複数ある手（高点法）
  //
  // 同じ面子分解でも、和了牌を雀頭・順子・刻子のどこに入れたと見るかで役・符が
  // 変わる。ライブラリは最も高い解釈を採る必要がある。期待値は役と符を手で
  // 積み上げた値（Primary）で、参照実装は照合用（Secondary）。
  // --------------------------------------------------------------------------
  {
    description:
      "子 門前 雀頭と順子の両方に入る和了牌は平和が付く両面を採る 2飜30符",
    tehai: "3344555m123456s", // 13枚. 345m 345m 55m 123s 456s
    // 5m を 55m に入れると単騎（一盃口のみ 40符）、345m に入れると両面（平和 + 一盃口）。
    // 20(副底) + 10(門前ロン) -> 30符
    agariHai: HaiKind.ManZu5,
    agariStr: "5m",
    doraMarkers: [HaiKind.ManZu8],
    doraStr: ["8m"],
    isTsumo: false,
    isOya: false,
    expected: { han: 2, fu: 30, total: 2000 },
  },
  {
    description:
      "子 門前 同じ牌姿でも和了牌が順子にしか入らなければ平和のみ 1飜30符",
    tehai: "3344555m123456s", // 13枚. 234m 345m 55m 123s 456s
    // 2m は 234m にしか入らないので両面。一盃口は無い。
    agariHai: HaiKind.ManZu2,
    agariStr: "2m",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: false,
    expected: { han: 1, fu: 30, total: 1000 },
  },
  {
    description: "子 門前 雀頭と順子の両方に入るが単騎のほうが符が高い 3飜60符",
    tehai: "3455m999p666s111z", // 13枚. 345m 55m 999p 666s 111z
    // 刻子があるので平和は付かず、5m は単騎（+2符）で 60符、両面なら 50符。
    // 20(副底) + 10(門前ロン) + 8(999p) + 4(666s) + 8(111z) + 2(単騎) = 52 -> 60符
    // 場風(東) 1翻 + 三暗刻 2翻。
    agariHai: HaiKind.ManZu5,
    agariStr: "5m",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: false,
    expected: { han: 3, fu: 60, total: 7700 },
  },
  {
    description:
      "子 門前 刻子と順子の両方に入る和了牌は刻子を暗刻に残す 1飜50符",
    tehai: "22234m555z678s33s", // 13枚. 222m 234m 555z 678s 33s
    // 2m を 222m に入れるとロンで明刻（2符）、234m に入れると両面で 222m は暗刻（4符）。
    // 20(副底) + 10(門前ロン) + 4(222m 暗刻) + 8(555z 暗刻) = 42 -> 50符。白 1翻。
    agariHai: HaiKind.ManZu2,
    agariStr: "2m",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: false,
    expected: { han: 1, fu: 50, total: 1600 },
  },
  {
    description: "子 門前 刻子と順子の両方に入る和了牌で三暗刻を残す 2飜60符",
    tehai: "11123m999p555s66z", // 13枚. 111m 123m 999p 555s 66z
    // 1m を 111m に入れると明刻で暗刻 2 つ（役なし）、123m に入れると三暗刻。
    // 20(副底) + 10(門前ロン) + 8(111m) + 8(999p) + 4(555s) + 2(發の雀頭) = 52 -> 60符
    agariHai: HaiKind.ManZu1,
    agariStr: "1m",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: false,
    expected: { han: 2, fu: 60, total: 3900 },
  },
  {
    description: "子 門前 2つの順子に入る和了牌は平和が付く両面を採る 1飜30符",
    tehai: "12345m456p678s99p", // 13枚. 123m 345m 456p 678s 99p
    // 3m を 123m に入れると辺張（役なし）、345m に入れると両面で平和。
    agariHai: HaiKind.ManZu3,
    agariStr: "3m",
    doraMarkers: [],
    doraStr: [],
    isTsumo: false,
    isOya: false,
    expected: { han: 1, fu: 30, total: 1000 },
  },
];
// ============================================================================

interface ReferenceInput {
  id: string;
  tehai: string;
  agariHai: string;
  doraMarkers: string[];
  isTsumo: boolean;
  isOya: boolean;
  bakaze: "Ton";
  jikaze: "Ton" | "Nan";
}

interface ReferenceResult {
  id: string;
  han?: number;
  fu?: number;
  cost?: {
    main: number;
    additional: number;
  };
  error?: string | null;
}

const caseId = (index: number): string => `case_${index}`;

/**
 * 参照実装の cost (main / additional) から支払い合計を求める。
 * mahjong ライブラリの cost は、ツモなら親の支払いが main・子の支払いが additional、
 * ロンなら放銃者の支払いが main に入る。
 */
function toReferenceTotal(
  cost: Readonly<{ main: number; additional: number }>,
  c: Readonly<ScoreCase>,
): number {
  if (!c.isTsumo) return cost.main;
  // 親ツモ: 子の支払い * 3 / 子ツモ: main (親) + additional (子) * 2
  return c.isOya ? cost.main * 3 : cost.main + cost.additional * 2;
}

describe("受け入れテスト: 点数計算 (vs Python mahjong)", () => {
  let referenceResults: ReferenceResult[] = [];

  beforeAll(() => {
    // 参照実装が動かない場合は throw し、このファイルの全ケースを失敗させる
    ensureVerifierImage();

    const inputs: ReferenceInput[] = CASES.map((c, index) => ({
      id: caseId(index),
      tehai: c.tehai,
      agariHai: c.agariStr,
      doraMarkers: c.doraStr,
      isTsumo: c.isTsumo,
      isOya: c.isOya,
      bakaze: "Ton",
      jikaze: c.isOya ? "Ton" : "Nan",
    }));
    referenceResults = runReferenceVerifier<ReferenceResult>(
      "verify_score.py",
      inputs,
    );
  });

  CASES.forEach((c, index) => {
    it(`${c.description} -> ${c.expected.total}点`, () => {
      // 1. 設定オブジェクトの構築
      const config: ScoreCalculationConfig = {
        agariHai: c.agariHai,
        isTsumo: c.isTsumo,
        jikaze: c.isOya ? HaiKind.Ton : HaiKind.Nan,
        bakaze: HaiKind.Ton,
        doraMarkers: c.doraMarkers,
      };

      // 2. 手牌のパース
      // calculateScoreForTehai は和了牌を含む 14 枚 (Tehai14) を受け取るため、
      // 13 枚の手牌文字列に和了牌を連結して作成する。
      const tehai14 = createTehai(c.tehai + c.agariStr);

      // 3. 点数の計算 (統合APIを使用)
      const score = unwrapOrThrow(calculateScoreForTehai(tehai14, config));
      const localTotal = getPaymentTotal(score.payment);

      // 4. 定義された期待値との検証 (Primary)
      expect(score.han, "飜数が期待値と異なります").toBe(c.expected.han);
      expect(score.fu, "符が期待値と異なります").toBe(c.expected.fu);
      expect(localTotal, "支払い合計が期待値と異なります").toBe(
        c.expected.total,
      );

      // 5. Pythonリファレンス実装とのクロスチェック (Secondary)
      const ref = referenceResults.find((r) => r.id === caseId(index));
      if (!ref) {
        throw new Error(`参照実装の結果が見つかりません (${c.description})`);
      }
      if (ref.error) {
        throw new Error(`参照実装エラー (${c.description}): ${ref.error}`);
      }
      if (ref.han === undefined || ref.fu === undefined || !ref.cost) {
        throw new Error(
          `参照実装の結果が不完全です (${c.description}): ${JSON.stringify(ref)}`,
        );
      }
      const refTotal = toReferenceTotal(ref.cost, c);
      expect(
        { han: ref.han, fu: ref.fu, total: refTotal },
        "参照実装の結果が期待値と異なります。テストデータまたは検証スクリプトを確認してください",
      ).toEqual(c.expected);
      expect(score.han, "飜数が参照実装と異なります").toBe(ref.han);
      expect(score.fu, "符が参照実装と異なります").toBe(ref.fu);
      expect(localTotal, "支払い合計が参照実装と異なります").toBe(refTotal);
    });
  });
});
