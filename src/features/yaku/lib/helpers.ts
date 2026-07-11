import type {
  HouraStructure,
  Kantsu,
  Koutsu,
  MentsuHouraStructure,
  Shuntsu,
  Toitsu,
} from "../types";
import { type HouraContext } from "../types";
import type { CompletedMentsu, HaiKindId } from "../../../types";
import { HaiType } from "../../../types";
import {
  isSuupai,
  kindIdToHaiType,
  kindIdToSuitIndex,
} from "../../../core/hai";

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
 */
export const countAnkou = (
  hand: HouraStructure,
  context: HouraContext,
): number => {
  if (hand.type !== "Mentsu") {
    return 0;
  }

  const triplets = extractTriplets(hand);

  let ankouCount = 0;

  for (const triplet of triplets) {
    if (triplet.furo) continue;

    const isAgariHaiInTriplet = triplet.hais.includes(context.agariHai);

    // 単騎待ちかどうかの判定: 雀頭の牌が和了牌と同じかどうか
    const isTanki = hand.jantou.hais[0] === context.agariHai;

    if (context.isTsumo) {
      // ツモなら、副露していなければ全て暗刻
      ankouCount++;
    } else {
      // ロン和了の場合
      if (isAgariHaiInTriplet) {
        // 和了牌を含む刻子の場合
        if (isTanki) {
          // 単騎待ちなら暗刻
          ankouCount++;
        }
      } else {
        // 和了牌を含まない刻子は暗刻
        ankouCount++;
      }
    }
  }

  return ankouCount;
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
): number => {
  let count = 0;
  const triplets = extractTriplets(hand);

  for (const triplet of triplets) {
    if (targetKinds.includes(triplet.hais[0])) {
      count++;
    }
  }

  return count;
};

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
export const combinations3 = <T>(list: readonly T[]): [T, T, T][] => {
  const combos: [T, T, T][] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      for (let k = j + 1; k < list.length; k++) {
        const a = list[i];
        const b = list[j];
        const c = list[k];
        if (a !== undefined && b !== undefined && c !== undefined) {
          combos.push([a, b, c]);
        }
      }
    }
  }
  return combos;
};

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
  const shuntsuCounts = new Map<number, number>();
  for (const shuntsu of extractShuntsu(hand)) {
    const key = shuntsu.hais[0];
    shuntsuCounts.set(key, (shuntsuCounts.get(key) ?? 0) + 1);
  }

  let pairCount = 0;
  for (const count of shuntsuCounts.values()) {
    pairCount += Math.floor(count / 2);
  }

  return pairCount;
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
  let blocks;
  if (hand.type === "Mentsu") {
    blocks = getMentsuBlocks(hand);
  } else if (hand.type === "Chiitoitsu") {
    blocks = hand.pairs;
  } else {
    return undefined;
  }

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
