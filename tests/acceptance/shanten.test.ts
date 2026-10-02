import { beforeAll, describe, expect, it } from "vitest";
import { calculateShanten, parseMspz, validateTehai13 } from "../../src/index";
import {
  ensureVerifierImage,
  runReferenceVerifier,
} from "./reference-verifier";

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
  error?: string | null;
}

const caseId = (index: number): string => `case_${index}`;

describe("相互検証: シャンテン数計算 (mahjongライブラリ使用)", () => {
  let referenceResults: ReferenceResult[] = [];

  beforeAll(() => {
    // 参照実装が動かない場合は throw し、このファイルの全ケースを失敗させる
    ensureVerifierImage();

    const inputs: ReferenceInput[] = CASES.map(([mspz], index) => ({
      id: caseId(index),
      mode: "shanten",
      tehai: mspz,
    }));
    referenceResults = runReferenceVerifier<ReferenceResult>(
      "verify_shanten.py",
      inputs,
    );
  });

  // テストケースを動的に生成
  CASES.forEach(([mspz, expected], index) => {
    it(`${mspz} -> ${expected} シャンテン`, () => {
      // parseMspz / calculateShanten は neverthrow の Result を返すため unwrap する
      const parsed = parseMspz(mspz);
      if (parsed.isErr()) {
        throw new Error(
          `手牌のパースに失敗しました (${mspz}): ${parsed.error.message}`,
        );
      }
      const tehai = parsed.value;

      // 現在の calculateShanten は13枚の手牌のみをサポート
      const haiCount = tehai.closed.length + tehai.exposed.length;
      if (haiCount !== 13) {
        throw new Error(
          `テストデータ不正: 手牌の枚数が13枚ではありません (${mspz}: ${haiCount}枚)`,
        );
      }

      // ローカル計算実行
      const validated = validateTehai13(tehai);
      if (validated.isErr()) {
        throw new Error(
          `手牌の検証に失敗しました (${mspz}): ${validated.error.message}`,
        );
      }
      const shantenResult = calculateShanten(validated.value);
      if (shantenResult.isErr()) {
        throw new Error(
          `シャンテン計算に失敗しました (${mspz}): ${shantenResult.error.message}`,
        );
      }
      const localResult = shantenResult.value;

      // 1. 定義された期待値との検証 (Primary)
      expect(localResult, `ローカル結果が期待値と異なります (${mspz})`).toBe(
        expected,
      );

      // 2. Pythonリファレンス実装とのクロスチェック (Secondary)
      const ref = referenceResults.find((r) => r.id === caseId(index));
      if (!ref) {
        throw new Error(`参照実装の結果が見つかりません (${mspz})`);
      }
      if (ref.error) {
        throw new Error(`参照実装エラー (${mspz}): ${ref.error}`);
      }
      expect(
        ref.shanten,
        `参照実装の結果が期待値と異なります (${mspz})。テストデータまたは検証スクリプトを確認してください`,
      ).toBe(expected);
      expect(
        localResult,
        `ローカル結果と参照実装の結果が異なります (${mspz})`,
      ).toBe(ref.shanten);
    });
  });
});
