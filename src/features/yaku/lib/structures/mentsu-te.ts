import type { CompletedMentsu, HaiKindId } from "../../../../types";
import type { MentsuDecomposition } from "../../../../types";
import { countHaiKind, shuntsuKindsAt } from "../../../../core/hai-count";
import { isTuple4 } from "../../../../utils/assertions";
import { HAI_KIND_IDS } from "../../../../types";
import type { Tehai14, Shuntsu, Koutsu } from "../../../../types";

/**
 * 枚数分布から指定した牌を抜き取った新しい分布を返す。
 *
 * 面子分解はバックトラック探索だが、分布を破壊的に更新して復元するのではなく
 * 分岐ごとに新しい分布を生成することで、呼び出し元の配列を変更しない。
 * 分布は34要素固定なので複製のコストは無視できる。
 */
function takeHais(
  counts: readonly number[],
  hais: readonly HaiKindId[],
): readonly number[] {
  return counts.map((count, i) => count - hais.filter((h) => h === i).length);
}

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
 * 【和了牌の置き場所について】
 * ここで返すのは面子分解だけで、和了牌をどのブロックに入れたかは持ちません
 * （{@link MentsuDecomposition}）。置き場所の展開は和了牌を知る側
 * （和了解釈の評価）が行います。
 *
 * 【重複について】
 * 探索は先頭の牌から刻子・順子の両方を試すため、同じ面子の集合が異なる並びで
 * 複数回現れます（例: 111123m は「111m → 123m」と「123m → 111m」）。並びが
 * 違うだけの分解は同じ和了形なので、最初に現れたものだけを返します。
 *
 * @param tehai 和了形の手牌
 * @returns 可能な構造化パターンのリスト。構造化できない場合は空配列。
 */
export function getHouraStructuresForMentsuTe(
  tehai: Tehai14,
): MentsuDecomposition[] {
  const counts = countHaiKind(tehai.closed);
  const requiredMentsuCount = 4 - tehai.exposed.length;

  // 雀頭候補ごとに、残りの牌が面子に分解できるか試す
  const decompositions = HAI_KIND_IDS.filter(
    (kind) => counts[kind] >= 2,
  ).flatMap((kind) =>
    decomposeClosedMentsu(
      takeHais(counts, [kind, kind]),
      requiredMentsuCount,
    ).flatMap((closedMentsu): MentsuDecomposition[] => {
      // 副露面子と結合して完全な構成を作成する
      const fullMentsuList = [...closedMentsu, ...tehai.exposed];

      // 4面子であることを確認（ロジック上は保証されているはずだが、念のため）
      if (!isTuple4(fullMentsuList)) return [];
      return [
        {
          type: "Mentsu",
          fourMentsu: fullMentsuList,
          jantou: { type: "Toitsu", hais: [kind, kind] },
        },
      ];
    }),
  );

  return dedupeDecompositions(decompositions);
}

/**
 * 面子の並びだけが異なる分解を 1 つにまとめる。
 * 雀頭と、面子の多重集合（種類・牌・副露）が同じなら同じ分解とみなす。
 */
function dedupeDecompositions(
  decompositions: readonly MentsuDecomposition[],
): MentsuDecomposition[] {
  const keyOf = (d: MentsuDecomposition): string => {
    const mentsuKeys = d.fourMentsu
      .map(
        (m) =>
          `${m.type}:${m.hais.join(",")}:${m.furo ? `${m.furo.type}/${m.furo.from}` : "closed"}`,
      )
      .sort();
    return `${d.jantou.hais.join(",")}|${mentsuKeys.join("|")}`;
  };

  const { kept } = decompositions.reduce<{
    readonly kept: readonly MentsuDecomposition[];
    readonly seen: ReadonlySet<string>;
  }>(
    (acc, d) => {
      const key = keyOf(d);
      return acc.seen.has(key)
        ? acc
        : { kept: [...acc.kept, d], seen: new Set([...acc.seen, key]) };
    },
    { kept: [], seen: new Set() },
  );
  return [...kept];
}

/**
 * 閉じた手牌の残りを面子に分解する再帰関数。
 * 引数の分布は変更せず、面子を抜いた新しい分布で再帰する。
 */
function decomposeClosedMentsu(
  counts: readonly number[],
  requiredCount: number,
): CompletedMentsu[][] {
  if (requiredCount === 0) {
    // 全ての牌が使用されたか確認
    const remaining = counts.reduce((acc, c) => acc + c, 0);
    return remaining === 0 ? [[]] : [];
  }

  // 面子の重複順列を防ぎ決定論的な順序を強制するため、カウントが0より大きい最初の牌を見つける
  const kind = HAI_KIND_IDS.find((k) => (counts[k] ?? 0) > 0);
  if (kind === undefined) {
    // requiredCount > 0 で牌が残っていない＝不正な手牌
    return [];
  }

  return [
    ...decomposeWithKoutsu(counts, kind, requiredCount),
    ...decomposeWithShuntsu(counts, kind, requiredCount),
  ];
}

/**
 * 先頭の牌種で刻子を作れる場合、刻子を抜いた残りを分解した結果を返す。
 */
function decomposeWithKoutsu(
  counts: readonly number[],
  kind: HaiKindId,
  requiredCount: number,
): CompletedMentsu[][] {
  if ((counts[kind] ?? 0) < 3) return [];

  const koutsu: Koutsu = { type: "Koutsu", hais: [kind, kind, kind] };
  return decomposeClosedMentsu(
    takeHais(counts, [kind, kind, kind]),
    requiredCount - 1,
  ).map((tail) => [koutsu, ...tail]);
}

/**
 * 先頭の牌種から順子を作れる場合、順子を抜いた残りを分解した結果を返す。
 * 数牌（0-26）かつ7を超えない（n, n+1, n+2を作れる）場合のみ有効。
 */
function decomposeWithShuntsu(
  counts: readonly number[],
  kind: HaiKindId,
  requiredCount: number,
): CompletedMentsu[][] {
  const kinds = shuntsuKindsAt(kind);
  if (kinds === undefined) return [];

  const [, k2, k3] = kinds;
  if ((counts[k2] ?? 0) === 0 || (counts[k3] ?? 0) === 0) return [];

  const shuntsu: Shuntsu = { type: "Shuntsu", hais: kinds };
  return decomposeClosedMentsu(takeHais(counts, kinds), requiredCount - 1).map(
    (tail) => [shuntsu, ...tail],
  );
}
