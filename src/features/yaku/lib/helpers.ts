import type {
  HouraStructure,
  Kantsu,
  Koutsu,
  MentsuHouraStructure,
  Shuntsu,
  Toitsu,
} from "../types";
import { type HouraContext } from "../types";
import type { CompletedMentsu, HaiKindId, MentsuIndex } from "../../../types";
import { HaiType } from "../../../types";
import {
  isSuupai,
  kindIdToHaiType,
  kindIdToSuitIndex,
} from "../../../core/hai";
import { isCompletedByAgari } from "../../../core/agari";

/**
 * 面子手の手牌枠（雀頭 + 4面子）を1つの配列として取得する。
 * 帯幺九系・三元/四喜系など「雀頭を含む全ブロック」を走査する判定に使用。
 */
export const getMentsuBlocks = (
  hand: MentsuHouraStructure,
): readonly (CompletedMentsu | Toitsu)[] => [hand.jantou, ...hand.fourMentsu];

/**
 * 手牌枠から順子を抽出する。
 * 面子手以外の場合は空配列を返す。
 */
export const extractShuntsu = (hand: HouraStructure): readonly Shuntsu[] => {
  if (hand.type !== "Mentsu") {
    return [];
  }
  return hand.fourMentsu.filter((m): m is Shuntsu => m.type === "Shuntsu");
};

/**
 * 手牌枠から刻子・槓子（トリプル）を抽出する。
 * 面子手以外の場合は空配列を返す。
 */
export const extractTriplets = (
  hand: HouraStructure,
): readonly (Koutsu | Kantsu)[] => {
  if (hand.type !== "Mentsu") {
    return [];
  }
  return hand.fourMentsu.filter(
    (m): m is Koutsu | Kantsu => m.type === "Koutsu" || m.type === "Kantsu",
  );
};

/**
 * 手牌の刻子・槓子のうち、暗刻の数をカウントする
 * 四暗刻・三暗刻などの判定に使用
 *
 * 副露していない刻子・槓子は暗刻だが、ロン和了で和了牌が完成させた刻子
 * （`hand.agari` が指す面子）だけは明刻になる。「和了牌を含む刻子」で
 * 判定しないのは、同じ牌が順子にも入る手（例: 111m 123m の 1m）で、順子に
 * 入れた解釈では刻子が暗刻のまま残るため。
 */
export const countAnkou = (
  hand: HouraStructure,
  context: HouraContext,
): number => {
  if (hand.type !== "Mentsu") {
    return 0;
  }

  const indices: readonly MentsuIndex[] = [0, 1, 2, 3];
  return indices.filter((index) => {
    const mentsu = hand.fourMentsu[index];
    if (mentsu.type === "Shuntsu" || mentsu.furo) return false;
    return context.isTsumo === true || !isCompletedByAgari(hand, index);
  }).length;
};

/**
 * 雀頭が指定した牌種群のいずれかであるか判定する。
 * 小三元・小四喜など「刻子N + 雀頭」型の役の判定に使用。
 */
export const isJantouOf = (
  hand: MentsuHouraStructure,
  targetKinds: readonly HaiKindId[],
): boolean => targetKinds.includes(hand.jantou.hais[0]);

/**
 * 手牌枠の中で指定した牌種（HaiKindId）からなる刻子・槓子の数をカウントする
 * 大三元・小三元・大四喜・小四喜などの判定に使用
 */
export const countSpecificKoutsu = (
  hand: HouraStructure,
  targetKinds: readonly HaiKindId[],
): number =>
  extractTriplets(hand).filter((triplet) =>
    targetKinds.includes(triplet.hais[0]),
  ).length;

/**
 * 指定した条件を満たす牌種のみで手牌が構成されているか判定する
 * 緑一色・字一色・清老頭などの判定に使用
 */
export const isAllHaisMatch = (
  hand: HouraStructure,
  predicate: (id: HaiKindId) => boolean,
): boolean => {
  if (hand.type === "Mentsu") {
    const allHais = [
      ...hand.fourMentsu.flatMap((m) => m.hais),
      ...hand.jantou.hais,
    ];
    return allHais.every(predicate);
  } else if (hand.type === "Chiitoitsu") {
    const allHais = hand.pairs.flatMap((p) => p.hais);
    return allHais.every(predicate);
  } else {
    // KokushiHouraStructure uses yaochu (and jantou which is in yaochu)
    return hand.yaochu.every(predicate);
  }
};

/**
 * リストから3要素の組み合わせを全て抽出する。
 * 三色同順・三色同刻・一気通貫など「3面子の組み合わせ」を総当りする判定に使用。
 */
export const combinations3 = <T>(list: readonly T[]): [T, T, T][] =>
  list.flatMap((a, i) =>
    list
      .slice(i + 1)
      .flatMap((b, j) =>
        list.slice(i + j + 2).map((c): [T, T, T] => [a, b, c]),
      ),
  );

/**
 * 順子のリストから3つの組み合わせを全て抽出する
 * 一気通貫や三色同順などの判定に使用
 */
export const getShuntsuCombinations3 = (
  shuntsuList: readonly Shuntsu[],
): [Shuntsu, Shuntsu, Shuntsu][] => combinations3(shuntsuList);

/**
 * 3つの面子の先頭牌が「三色（異なる3色）かつ同一数字」を満たすか判定する。
 * 三色同順・三色同刻で共通のロジック。字牌が含まれる場合は false。
 */
export const isSanshoku = (
  firstHais: readonly [HaiKindId, HaiKindId, HaiKindId],
): boolean => {
  const suits = firstHais.map(kindIdToSuitIndex);
  if (suits.some((s) => s === undefined)) return false;

  // 異なる3色でなければならない
  if (new Set(suits).size !== 3) return false;

  // 構成数字が一致しなければならない
  const nums = firstHais.map((h) => h % 9);
  return nums[0] === nums[1] && nums[1] === nums[2];
};

/**
 * 順子のペア数をカウントする。
 *
 * 和了構造から順子を抽出し、先頭牌IDをキーにカウントして同一順子のペア数を算出する。
 * 一盃口 (pairCount === 1) と二盃口 (pairCount >= 2) の判定に使用。
 *
 * @param hand 和了構造（面子手のみ対応）
 * @returns 同一順子のペア数。面子手以外の場合は 0。
 */
export const countShuntsuPairs = (hand: HouraStructure): number => {
  const shuntsuCounts = extractShuntsu(hand).reduce(
    (counts, shuntsu) =>
      counts.set(shuntsu.hais[0], (counts.get(shuntsu.hais[0]) ?? 0) + 1),
    new Map<HaiKindId, number>(),
  );

  return [...shuntsuCounts.values()].reduce(
    (pairCount, count) => pairCount + Math.floor(count / 2),
    0,
  );
};

/**
 * 牌の集合として扱えるブロック（面子・対子）。
 * 面子手の面子・雀頭と七対子の対子を区別せずに走査する判定に使用。
 */
export interface HaiBlock {
  readonly hais: readonly HaiKindId[];
}

/**
 * 和了構造を構成する全ブロック（面子手: 雀頭 + 4面子、七対子: 7対子）を取得する。
 * 国士無双はブロック構造を持たないため undefined を返す。
 */
export const getHaiBlocks = (
  hand: HouraStructure,
): readonly HaiBlock[] | undefined => {
  switch (hand.type) {
    case "Mentsu":
      return getMentsuBlocks(hand);
    case "Chiitoitsu":
      return hand.pairs;
    case "Kokushi":
      return undefined;
  }
};

/**
 * 一色系役（混一色・清一色）の共通判定ロジック。
 *
 * 和了構造からブロックを取得し、全牌をフラット化して
 * 字牌の有無と数牌の種類を分析する。
 *
 * @param hand 和了構造
 * @returns 分析結果。国士無双の場合は undefined を返す。
 *   - hasJihai: 字牌が含まれるか
 *   - suupaiSuit: 数牌が1種のみの場合その牌種タイプ、複数種または数牌なしなら undefined
 */
export const analyzeIshokuPattern = (
  hand: HouraStructure,
): { hasJihai: boolean; suupaiSuit: HaiType | undefined } | undefined => {
  const blocks = getHaiBlocks(hand);
  if (blocks === undefined) return undefined;

  const allHais = blocks.flatMap((b) => b.hais);

  const hasJihai = allHais.some((k) => kindIdToHaiType(k) === HaiType.Jihai);

  const suupais = allHais.filter((k) => isSuupai(k));
  const firstSuupai = suupais[0];
  if (firstSuupai === undefined) {
    return { hasJihai, suupaiSuit: undefined };
  }

  const firstSuupaiType = kindIdToHaiType(firstSuupai);
  const isAllSameType = suupais.every(
    (k) => kindIdToHaiType(k) === firstSuupaiType,
  );

  return {
    hasJihai,
    suupaiSuit: isAllSameType ? firstSuupaiType : undefined,
  };
};
