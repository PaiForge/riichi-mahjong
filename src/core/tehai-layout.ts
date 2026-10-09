import type {
  CompletedMentsu,
  HaiCode,
  MentsuHouraStructure,
  MentsuIndex,
  Toitsu,
} from "../types";
import { compareHaiCode, sortHaiCodes } from "./hai";

/**
 * 手牌のブロック (TehaiBlock)
 *
 * 面子・雀頭など、手牌から切り出した牌のまとまりを並べ替えるための見え方。
 * {@link sortBlocksByTehai} が並び順を決めるのに必要な情報だけを持つ。
 */
export interface TehaiBlock {
  /** ブロックを構成する牌（牌コードまたは牌種ID） */
  readonly hais: readonly HaiCode[];
  /** 手牌の右に晒すブロック（副露・暗槓）なら true */
  readonly isExposed: boolean;
}

/**
 * 理牌した牌の列どうしを辞書順に比較する。一方が他方の接頭辞なら短い方が先。
 */
function compareSortedHais(
  a: readonly HaiCode[],
  b: readonly HaiCode[],
): number {
  const common = Math.min(a.length, b.length);
  for (let i = 0; i < common; i += 1) {
    const ha = a[i];
    const hb = b[i];
    if (ha === undefined || hb === undefined) break;
    const diff = compareHaiCode(ha, hb);
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}

/**
 * 手牌のブロック（面子・雀頭）を手牌の左から右の並びの順に並べ替える（手牌配置）。
 *
 * 手牌は「理牌した純手牌 → 晒したブロック」の順に並ぶ。そこで手の内の
 * ブロックを、各ブロックの牌を理牌した列の辞書順（{@link compareHaiCode}
 * の順。一方が他方の接頭辞なら短い方が先）に並べ、晒したブロック
 * （副露・暗槓）をその後ろに元の順（鳴いた順）のまま置く。
 *
 * 安定ソートのため、同じ牌のブロック（同じ順子が 2 つなど）は元の順を保つ。
 * 新しい配列を返し、引数の配列は変更しない。
 *
 * 手牌から面子を切り出して見せる表（符の内訳、面子分解）をこの順に並べる
 * と、理牌した手牌（{@link sortTehai}）の見た目と対応する。
 *
 * @param blocks 並べ替えるブロック
 * @param describe ブロックの牌と、晒すかどうかを返す関数
 * @returns 手牌の並びの順に並べ替えたブロック
 */
export function sortBlocksByTehai<B>(
  blocks: readonly B[],
  describe: (block: B) => TehaiBlock,
): B[] {
  const described = blocks.map((block) => {
    const { hais, isExposed } = describe(block);
    return { block, isExposed, sortedHais: sortHaiCodes(hais) };
  });
  const closed = described
    .filter((d) => !d.isExposed)
    .sort((a, b) => compareSortedHais(a.sortedHais, b.sortedHais));
  const exposed = described.filter((d) => d.isExposed);
  return [...closed, ...exposed].map((d) => d.block);
}

/**
 * 和了形のブロック (HouraBlock)
 *
 * 面子手の和了構造（{@link MentsuHouraStructure}）を構成する雀頭と 4 面子の
 * いずれか。`kind` と `index` の形は和了牌の置き場所（`AgariPlacement`）と
 * 揃えてあり、`agari.kind === block.kind && agari.index === block.index`
 * で和了牌のブロックを引ける。
 */
export type HouraBlock =
  | {
      /** 雀頭 */
      readonly kind: "Jantou";
      readonly block: Toitsu;
    }
  | {
      /** `fourMentsu[index]` の面子 */
      readonly kind: "Mentsu";
      readonly index: MentsuIndex;
      readonly block: CompletedMentsu;
    };

/** 面子の添字の一覧。`fourMentsu` の長さ 4 に対応する */
const MENTSU_INDICES: readonly MentsuIndex[] = [0, 1, 2, 3];

/**
 * 面子手の和了構造のブロック（雀頭と 4 面子）を手牌の左から右の並びの順に並べる（手牌配置）。
 *
 * {@link sortBlocksByTehai} の和了構造向け。雀頭を面子の間に混ぜ、手の内の
 * ブロックを牌の順に、晒した面子（`furo` を持つ副露と、`furo` のない槓子
 * = 暗槓）をその後ろに `fourMentsu` の順で置いた 5 要素を返す。
 *
 * 和了構造の `fourMentsu` の並びは面子分解の列挙順であり手牌の見た目とは
 * 一致しないため、面子分解や符の内訳を手牌と同じ並びで見せたいときに使う。
 *
 * @param structure 面子手の和了構造
 * @returns 手牌の並びの順に並べた雀頭と 4 面子
 */
export function sortHouraBlocksByTehai(
  structure: MentsuHouraStructure,
): readonly HouraBlock[] {
  const blocks: readonly HouraBlock[] = [
    { kind: "Jantou", block: structure.jantou },
    ...MENTSU_INDICES.map(
      (index): HouraBlock => ({
        kind: "Mentsu",
        index,
        block: structure.fourMentsu[index],
      }),
    ),
  ];
  return sortBlocksByTehai(blocks, (b) => ({
    hais: b.block.hais,
    isExposed: b.kind === "Mentsu" && isExposedMentsu(b.block),
  }));
}

/**
 * 手牌の右に晒す面子（副露、または暗槓）かどうか。
 * 副露情報のない槓子は暗槓であり、手の内ではなく晒して置く。
 */
function isExposedMentsu(mentsu: CompletedMentsu): boolean {
  return mentsu.furo !== undefined || mentsu.type === "Kantsu";
}
