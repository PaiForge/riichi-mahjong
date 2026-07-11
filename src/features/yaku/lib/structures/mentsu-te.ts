import type { CompletedMentsu } from "../../../../types";
import type { MentsuHouraStructure } from "../../types";
import { canStartShuntsuAt, countHaiKind } from "../../../../core/hai-count";
import { asHaiKindId, isTuple4 } from "../../../../utils/assertions";
import type { Tehai14, Shuntsu, Koutsu } from "../../../../types";

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
  // HaiKindDistributionはreadonlyなので、可変配列に複製する
  const counts: number[] = [...countHaiKind(tehai.closed)];
  const get = (i: number): number => counts[i] ?? 0;
  const add = (i: number, delta: number): void => {
    counts[i] = get(i) + delta;
  };

  const results: MentsuHouraStructure[] = [];
  const requiredMentsuCount = 4 - tehai.exposed.length;

  // 雀頭候補ごとに、残りの牌が面子に分解できるか試す
  for (let i = 0; i < 34; i++) {
    const kind = asHaiKindId(i);
    if (get(kind) < 2) continue;

    add(kind, -2); // 雀頭を抜き出す

    for (const closedMentsu of decomposeClosedMentsu(
      counts,
      requiredMentsuCount,
    )) {
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

    add(kind, 2); // バックトラック
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
  const get = (i: number): number => counts[i] ?? 0;
  const add = (i: number, delta: number): void => {
    counts[i] = get(i) + delta;
  };

  if (requiredCount === 0) {
    // 全ての牌が使用されたか確認
    const remaining = counts.reduce((acc, c) => acc + c, 0);
    return remaining === 0 ? [[]] : [];
  }

  // 面子の重複順列を防ぎ決定論的な順序を強制するため、カウントが0より大きい最初の牌を見つける
  const firstIndex = counts.findIndex((c) => c > 0);
  if (firstIndex === -1) {
    // requiredCount > 0 で牌が残っていない＝不正な手牌
    return [];
  }

  const results: CompletedMentsu[][] = [];
  const kind = asHaiKindId(firstIndex);

  // 刻子を試す
  if (get(kind) >= 3) {
    add(kind, -3);
    const koutsu: Koutsu = { type: "Koutsu", hais: [kind, kind, kind] };
    for (const tail of decomposeClosedMentsu(counts, requiredCount - 1)) {
      results.push([koutsu, ...tail]);
    }
    add(kind, 3); // バックトラック
  }

  // 順子を試す
  // 数牌（0-26）かつ7を超えない（n, n+1, n+2を作れる）場合のみ有効
  if (canStartShuntsuAt(kind)) {
    const k1 = kind;
    const k2 = asHaiKindId(kind + 1);
    const k3 = asHaiKindId(kind + 2);

    if (get(k2) > 0 && get(k3) > 0) {
      add(k1, -1);
      add(k2, -1);
      add(k3, -1);

      const shuntsu: Shuntsu = { type: "Shuntsu", hais: [k1, k2, k3] };
      for (const tail of decomposeClosedMentsu(counts, requiredCount - 1)) {
        results.push([shuntsu, ...tail]);
      }

      add(k1, 1);
      add(k2, 1);
      add(k3, 1); // バックトラック
    }
  }

  return results;
}
