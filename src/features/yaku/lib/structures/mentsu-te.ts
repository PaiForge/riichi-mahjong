import type { CompletedMentsu } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import { validateTehai14, countHaiKind } from "../../../../core/tehai";
import { isTuple4 } from "../../../../utils/assertions";
import type { Tehai14, HaiKindId, Shuntsu, Koutsu } from "../../../../types";

/**
 * 手牌を標準形（4面子1雀頭）に構造化する。
 * 七対子や国士無双は対象外。
 *
 * 【役判定について】
 * この関数は純粋に「4面子1雀頭」の形になっているかのみを検証します。
 * 役が成立しているかどうか（和了できるかどうか）は判定しません。
 * そのため、役なし（Yakunashi）の手牌であっても構造的に整合していれば結果を返します。
 *
 * 【戻り値が配列である理由について】
 * 麻雀の手牌は、同じ牌構成であっても複数の解釈（多義性）が成立する場合があります。
 * 例: `111222333m`
 * - 三暗刻 (111 + 222 + 333)
 * - 三連刻/一盃口 (123 + 123 + 123)
 *
 * このように成立する役が変わる可能性があるため、可能な全ての構造化パターンをリストとして返します。
 * 利用側は、これらのパターンのうち最も高得点となるものを選択する必要があります。
 *
 * @param tehai 和了形の手牌
 * @returns 可能な構造化パターンのリスト。構造化できない場合は空配列。
 */
export function getHouraStructuresForMentsuTe(
  tehai: Tehai14,
): MentsuHouraStructure[] {
  validateTehai14(tehai);

  // HaiKindDistributionはreadonlyなので、可変配列に複製する
  const counts = [...countHaiKind(tehai.closed)];
  const results: MentsuHouraStructure[] = [];

  // 1. 雀頭候補を探す
  for (let i = 0; i < 34; i++) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kind = i as HaiKindId;
    if ((counts[kind] ?? 0) >= 2) {
      // 雀頭抜き出し
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[kind]! -= 2;

      // 残りの牌で面子分解
      const requiredMentsuCount = 4 - tehai.exposed.length;
      const subResults = decomposeClosedMentsu(counts, requiredMentsuCount);

      // subResultsには閉じた部分で見つかった面子のリストが含まれる
      for (const closedMentsu of subResults) {
        // 副露面子と結合して完全な構成を作成する
        const fullMentsuList = [...closedMentsu, ...tehai.exposed];

        // 4面子であることを確認（ロジック上は保証されているはずだが、念のため）
        if (isTuple4(fullMentsuList)) {
          results.push({
            type: "Mentsu",
            fourMentsu: fullMentsuList,
            jantou: { type: "Toitsu", hais: [kind, kind] },
          });
        }
      }

      // バックトラック
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[kind]! += 2;
    }
  }

  return results;
}

/**
 * 閉じた手牌の残りを面子に分解する再帰関数
 */
function decomposeClosedMentsu(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  counts: number[],
  requiredCount: number,
): CompletedMentsu[][] {
  if (requiredCount === 0) {
    // 全ての牌が使用されたか確認
    const remaining = counts.reduce((acc, c) => acc + c, 0);
    return remaining === 0 ? [[]] : [];
  }

  // 面子の重複順列を防ぎ決定論的な順序を強制するため、カウントが0より大きい最初の牌を見つける
  let firstIndex = -1;
  for (let i = 0; i < 34; i++) {
    if ((counts[i] ?? 0) > 0) {
      firstIndex = i;
      break;
    }
  }

  if (firstIndex === -1) {
    // Should not happen if requiredCount > 0, unless invalid hand
    return [];
  }

  const results: CompletedMentsu[][] = [];
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const kind = firstIndex as HaiKindId;

  // 刻子を試す
  if ((counts[kind] ?? 0) >= 3) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts[kind]! -= 3;
    const tails = decomposeClosedMentsu(counts, requiredCount - 1);
    const koutsu: Koutsu = { type: "Koutsu", hais: [kind, kind, kind] };
    for (const tail of tails) {
      results.push([koutsu, ...tail]);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts[kind]! += 3; // バックトラック
  }

  // 順子を試す
  // 数牌（0-26）かつ7を超えない（n, n+1, n+2を作れる）場合のみ有効
  if (kind < 27 && kind % 9 <= 6) {
    const k1 = kind;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const k2 = (kind + 1) as HaiKindId;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const k3 = (kind + 2) as HaiKindId;

    if ((counts[k2] ?? 0) > 0 && (counts[k3] ?? 0) > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[k1]! -= 1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[k2]! -= 1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[k3]! -= 1;

      const tails = decomposeClosedMentsu(counts, requiredCount - 1);
      const shuntsu: Shuntsu = { type: "Shuntsu", hais: [k1, k2, k3] };
      for (const tail of tails) {
        results.push([shuntsu, ...tail]);
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[k1]! += 1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[k2]! += 1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      counts[k3]! += 1; // バックトラック
    }
  }

  return results;
}
