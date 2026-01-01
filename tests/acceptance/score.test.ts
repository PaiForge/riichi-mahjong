import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import { resolve } from "path";
import {
  calculateScore,
  type ScoreCalculationConfig,
} from "../../src/features/points";
import { createTehai } from "../../src/utils/test-helpers";
import { HaiKind } from "../../src/types";

// 現状は門前手のみテストするため、mspz文字列 (例: "123m456p...") で十分です。
// createTehai の mspz 形式は mahjong ライブラリの one_line_string_to_136_array ("123m") と互換性があります。

interface PythonScoreResult {
  id: string;
  han: number;
  fu: number;
  cost?: {
    main: number;
    additional: number;
  };
  error?: string;
}

describe("受け入れテスト: 点数計算 (vs Python mahjong)", () => {
  it("環境確認 (Sanity Check)", () => {
    expect(true).toBe(true);
  });

  const pythonScript = resolve(__dirname, "scripts/verify_score.py");

  // テストケースの定義
  const cases = [
    {
      description: "子 門前 平和・ツモ・ドラ1 3飜20符",
      tehai: "234m456m789m23p99s", // 13枚
      agariHai: HaiKind.PinZu4,
      agariStr: "4p",
      doraMarkers: [HaiKind.ManZu1],
      doraStr: ["1m"],
      isTsumo: true,
      isOya: false,
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
    },
  ];

  // 全ケースに対してPythonスクリプトを実行
  const inputJson = JSON.stringify(
    cases.map((c, i) => ({
      id: `case_${i}`,
      tehai: c.tehai,
      agariHai: c.agariStr,
      doraMarkers: c.doraStr,
      isTsumo: c.isTsumo,
      isOya: c.isOya,
      bakaze: "Ton",
      jikaze: c.isOya ? "Ton" : "Nan",
    })),
  );

  const pythonResult = spawnSync("python3", [pythonScript], {
    input: inputJson,
    encoding: "utf-8",
  });

  if (pythonResult.error) {
    console.error(
      "Pythonスクリプトの実行に失敗しました。受け入れテストをスキップします。",
      pythonResult.error,
    );
    return;
  }

  if (pythonResult.stderr) {
    console.error("Python標準エラー出力:", pythonResult.stderr);
  }

  let expectedResults: PythonScoreResult[] = [];
  try {
    expectedResults = JSON.parse(pythonResult.stdout) as PythonScoreResult[];
  } catch {
    console.error("Python出力のパースに失敗しました:", pythonResult.stdout);
    return;
  }

  // TypeScript実装との検証
  cases.forEach((c, i) => {
    const caseId = `case_${i}`;
    // 期待値の検索
    const expected = expectedResults.find((r) => r.id === caseId);
    if (expected?.cost) {
      const cost = expected.cost;
      let scoreDisplay = "";
      if (c.isTsumo) {
        if (c.isOya) {
          scoreDisplay = `${cost.main}オール`;
        } else {
          scoreDisplay = `${cost.additional}/${cost.main}`;
        }
      } else {
        scoreDisplay = `${cost.main}`;
      }

      it(`${c.description} -> ${scoreDisplay}`, () => {
        if (expected.error) {
          throw new Error(
            `ケース ${i} (${c.description}) のPythonスクリプトエラー: ${expected.error}`,
          );
        }

        // 1. 設定オブジェクトの構築
        const config: ScoreCalculationConfig = {
          agariHai: c.agariHai,
          isTsumo: c.isTsumo,
          jikaze: c.isOya ? HaiKind.Ton : HaiKind.Nan,
          bakaze: HaiKind.Ton,
          doraMarkers: c.doraMarkers,
          uraDoraMarkers: [],
        };

        // 2. 手牌のパース
        // createTehai("...4p") は単純に文字列連結した場合、14枚の牌を作成する可能性があります。
        // detectYakuのシグネチャを確認すると `tehai: Tehai14` となっています。
        // つまり、和了牌を手牌に含める必要があります。

        // 14枚の手牌文字列を構築
        const fullMspz = c.tehai + c.agariStr;
        // createTehai が単純な文字列連結で動作することを前提としています。
        const tehai14 = createTehai(fullMspz);

        // 3. 点数の計算 (統合APIを使用)
        const score = calculateScore(tehai14, config);

        // アサーション
        // Python出力: `han`, `fu`, `points` (total cost?) または `cost` 辞書。
        // `score.points.total` が一致することを確認します。

        let pyTotal = 0;
        if (c.isTsumo) {
          if (c.isOya) {
            // 親ツモ: 子の支払い * 3
            pyTotal = cost.main * 3;
          } else {
            // 子ツモ: main (親) + additional (子) * 2
            pyTotal = cost.main + cost.additional * 2;
          }
        } else {
          // ロン
          pyTotal = cost.main;
        }

        expect(score.han).toBe(expected.han);
        expect(score.fu).toBe(expected.fu);
        expect(score.points.total).toBe(pyTotal);
      });
    } else {
      // 期待値が取得できない場合のフォールバック（通常ありえないが）
      it(`ケース ${i} (${c.description}) (期待値取得失敗)`, () => {
        throw new Error("Pythonスクリプトからの期待値取得に失敗しました");
      });
    }
  });
});
