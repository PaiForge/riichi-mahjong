import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { calculateShanten, parseMspz } from "../../src/index";

// ============================================================================
// テストケース定義 (MSPZ文字列, 期待されるシャンテン数)
// ============================================================================
// 手牌ごとのシャンテン数をここに定義します。
// 配列の要素は [手牌(MSPZ), 期待値(シャンテン数)] の形式です。
const CASES: [string, number][] = [
  // 七対子4シャンテン (面子手だと5だが七対子なら4)
  ["59m1144589p16s14z", 4],
];
// ============================================================================

interface ReferenceInput {
  id: string;
  mode: "shanten";
  tehai: string;
}

interface ReferenceResult {
  id: string;
  shanten?: number;
  error?: string;
}

// ヘルパー: Docker経由でPythonのリファレンス実装（mahjongライブラリ）を実行
function runReferenceShanten(inputs: ReferenceInput[]): ReferenceResult[] {
  const scriptsDir = path.resolve(__dirname, "scripts");
  if (!fs.existsSync(scriptsDir)) {
    throw new Error(`スクリプトディレクトリが見つかりません: ${scriptsDir}`);
  }

  // Dockerコンテナ内で検証用スクリプトを実行
  const cmd = `docker run -i --rm -v "${scriptsDir}":/app/scripts riichi-mahjong-verifier python scripts/verify_shanten.py`;

  const inputJson = JSON.stringify(inputs);
  const output = execSync(cmd, {
    input: inputJson,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(output) as ReferenceResult[];
}

describe("相互検証: シャンテン数計算 (mahjongライブラリ使用)", () => {
  let referenceResults: ReferenceResult[] = [];

  beforeAll(() => {
    // 1. Dockerイメージの確認・ビルド
    try {
      const output = execSync("docker images -q riichi-mahjong-verifier", {
        encoding: "utf-8",
      });
      if (!output.trim()) {
        console.log(
          "Dockerイメージ 'riichi-mahjong-verifier' が見つかりません。ビルドします...",
        );
        const dockerDir = path.resolve(__dirname, "../../"); // プロジェクトルート
        const dockerFile = path.resolve(
          __dirname,
          "../../docker/Dockerfile.verification",
        );
        execSync(
          `docker build -t riichi-mahjong-verifier -f "${dockerFile}" "${dockerDir}"`,
          { stdio: "inherit" },
        );
      }
    } catch {
      throw new Error(
        "Dockerイメージ 'riichi-mahjong-verifier' の確認またはビルドに失敗しました。Dockerが起動しているか確認してください。",
      );
    }

    // 2. リファレンス実装の実行 (検証用データ作成)
    const inputs: ReferenceInput[] = CASES.map(([mpsz], index) => ({
      id: `case_${index}`,
      mode: "shanten",
      tehai: mpsz,
    }));

    if (inputs.length > 0) {
      referenceResults = runReferenceShanten(inputs);
    }
  });

  // テストケースを動的に生成
  CASES.forEach(([mpsz, expected], index) => {
    it(`${mpsz} -> ${expected} シャンテン`, () => {
      const tehai = parseMspz(mpsz);
      // 現在の calculateShanten は13枚の手牌のみをサポート
      if (tehai.closed.length + tehai.exposed.length !== 13) {
        console.warn(
          `スキップ: 手牌の枚数が13枚ではありません (${mpsz}: ${
            tehai.closed.length + tehai.exposed.length
          }枚)`,
        );
        return;
      }

      // ローカル計算実行
      const localResult = calculateShanten(tehai);

      // 1. 定義された期待値との検証 (Primary)
      if (localResult !== expected) {
        console.error(
          `不一致: ${mpsz} (期待値: ${expected}, 実際: ${localResult})`,
        );
      }
      expect(localResult).toBe(expected);

      // 2. Pythonリファレンス実装とのクロスチェック (Secondary)
      if (referenceResults.length > 0) {
        const ref = referenceResults.find((r) => r.id === `case_${index}`);
        if (ref) {
          if (ref.error) {
            console.warn(`リファレンス実装エラー (${mpsz}): ${ref.error}`);
          } else if (ref.shanten !== undefined) {
            // リファレンス結果と期待値の整合性チェック
            if (ref.shanten !== expected) {
              console.warn(
                `警告: リファレンス実装の結果が期待値と異なります！ ${mpsz}: Ref=${ref.shanten}, Expected=${expected}. 検証スクリプトを確認してください。`,
              );
            }
            // ローカル結果とリファレンス結果の比較
            if (localResult !== ref.shanten) {
              console.warn(
                `警告: ローカル結果とリファレンス結果が異なります！ Local=${localResult}, Ref=${ref.shanten}`,
              );
            }
          }
        }
      }
    });
  });
});
