import type {
  AgariPlacement,
  CompletedMentsu,
  HaiKindId,
  MentsuDecomposition,
  MentsuHouraStructure,
  MentsuIndex,
} from "../types";

const MENTSU_INDICES: readonly MentsuIndex[] = [0, 1, 2, 3];

/**
 * 面子の同一性を表すキー。種類・牌・副露の有無が同じ面子は、和了牌の
 * 置き場所として区別がつかない（例: 345m 345m のどちらに 5m を入れても
 * 待ち・符・見た目が同じ）。
 */
function mentsuIdentityKey(mentsu: CompletedMentsu): string {
  return `${mentsu.type}:${mentsu.hais.join(",")}:${mentsu.furo ? "furo" : "closed"}`;
}

/**
 * 和了牌の置き場所になりうる面子か判定する。
 *
 * 副露した面子は和了より前に完成している。槓子は4枚目を加えた時点で
 * 完成しており、和了牌（5枚目）で完成することはない。
 */
function canBeCompletedByAgari(
  mentsu: CompletedMentsu,
  agariHai: HaiKindId,
): boolean {
  return (
    mentsu.furo === undefined &&
    mentsu.type !== "Kantsu" &&
    mentsu.hais.includes(agariHai)
  );
}

/**
 * 面子分解に対して、和了牌の置き場所の候補をすべて列挙する (enumerateAgariPlacements)
 *
 * 雀頭が和了牌と同じ牌なら単騎の候補、和了牌を含む門前の順子・刻子は
 * それぞれ候補になる。列挙順は雀頭 → 面子の並び順で、同じ面子（種類・牌・
 * 副露の有無が一致）は最初の 1 つだけを候補にする。
 *
 * 和了牌が手牌のどのブロックにも含まれない場合は空配列を返す。
 *
 * @param decomposition 置き場所未確定の面子分解
 * @param agariHai 和了牌
 * @returns 置き場所の候補（列挙順）
 */
export function enumerateAgariPlacements(
  decomposition: Readonly<MentsuDecomposition>,
  agariHai: HaiKindId,
): readonly AgariPlacement[] {
  const jantou: readonly AgariPlacement[] =
    decomposition.jantou.hais[0] === agariHai
      ? [{ kind: "Jantou", hai: agariHai }]
      : [];

  const { placements } = MENTSU_INDICES.reduce<{
    readonly placements: readonly AgariPlacement[];
    readonly seen: ReadonlySet<string>;
  }>(
    (acc, index) => {
      const mentsu = decomposition.fourMentsu[index];
      if (!canBeCompletedByAgari(mentsu, agariHai)) return acc;

      const key = mentsuIdentityKey(mentsu);
      if (acc.seen.has(key)) return acc;

      return {
        placements: [
          ...acc.placements,
          { kind: "Mentsu", index, hai: agariHai },
        ],
        seen: new Set([...acc.seen, key]),
      };
    },
    { placements: [], seen: new Set() },
  );

  return [...jantou, ...placements];
}

/**
 * 面子分解を、和了牌の置き場所ごとの和了構造に展開する (expandAgariPlacements)
 *
 * @param decomposition 置き場所未確定の面子分解
 * @param agariHai 和了牌
 * @returns 置き場所の候補ごとの和了構造。候補が無ければ空配列
 */
export function expandAgariPlacements(
  decomposition: Readonly<MentsuDecomposition>,
  agariHai: HaiKindId,
): readonly MentsuHouraStructure[] {
  return enumerateAgariPlacements(decomposition, agariHai).map((agari) => ({
    ...decomposition,
    agari,
  }));
}

/**
 * 指定した位置の面子が和了牌で完成したか判定する (isCompletedByAgari)
 *
 * ロン和了では、和了牌で完成した刻子は明刻として扱う（符・暗刻数の判定）。
 */
export function isCompletedByAgari(
  hand: Readonly<MentsuHouraStructure>,
  index: MentsuIndex,
): boolean {
  return hand.agari.kind === "Mentsu" && hand.agari.index === index;
}

/**
 * 雀頭で和了した（単騎待ち）か判定する (isTankiAgari)
 */
export function isTankiAgari(hand: Readonly<MentsuHouraStructure>): boolean {
  return hand.agari.kind === "Jantou";
}
