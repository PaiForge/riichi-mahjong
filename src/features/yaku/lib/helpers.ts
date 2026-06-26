import type { HouraStructure, Kantsu, Koutsu, Shuntsu } from "../types";
import { type HouraContext } from "../types";
import type { HaiKindId } from "../../../types";
import { kindIdToSuitIndex } from "../../../core/hai";

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
